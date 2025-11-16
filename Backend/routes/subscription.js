import express from 'express';
import { body, validationResult } from 'express-validator';
import Subscription from '../models/Subscription.js';
import { SavingsExpense } from '../models/SavingsPlan.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/subscriptions
// @desc    Create a new subscription
// @access  Private
router.post('/', protect, [
  body('name')
    .notEmpty()
    .withMessage('Subscription name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('plan')
    .notEmpty()
    .withMessage('Subscription plan is required')
    .isLength({ max: 50 })
    .withMessage('Plan description cannot exceed 50 characters'),
  body('totalSpend')
    .isFloat({ min: 0 })
    .withMessage('Total spend must be a positive number'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isLength({ max: 50 })
    .withMessage('Duration cannot exceed 50 characters'),
  body('recurringPayment')
    .isIn(['Yes', 'No'])
    .withMessage('Recurring payment must be Yes or No'),
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string'),
  body('category')
    .optional()
    .isIn(['Streaming', 'Software', 'Gym', 'Music', 'News', 'Other'])
    .withMessage('Invalid category'),
  body('nextPaymentDate')
    .optional()
    .isISO8601()
    .withMessage('Next payment date must be a valid ISO date'),
  body('linkToSavingsPlan')
    .optional()
    .isBoolean()
    .withMessage('linkToSavingsPlan must be a boolean'),
  body('monthlyAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly amount must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      name, 
      plan, 
      totalSpend, 
      duration, 
      recurringPayment, 
      color, 
      category,
      nextPaymentDate,
      linkToSavingsPlan,
      monthlyAmount
    } = req.body;

    // If linking to savings plan, create/update savings expense
    let savingsExpenseId = null;
    if (linkToSavingsPlan && monthlyAmount && monthlyAmount > 0) {
      // Map subscription category to savings expense category
      const categoryMap = {
        'Streaming': 'Entertainment',
        'Software': 'Other',
        'Gym': 'Healthcare',
        'Music': 'Entertainment',
        'News': 'Other',
        'Other': 'Other'
      };
      
      const savingsCategory = categoryMap[category || 'Other'];
      
      // Create savings expense
      const savingsExpense = await SavingsExpense.create({
        category: savingsCategory,
        perMonth: monthlyAmount,
        user: req.user.id
      });
      
      savingsExpenseId = savingsExpense._id;
    }

    // Create new subscription
    const subscription = await Subscription.create({
      name,
      plan,
      totalSpend,
      duration,
      recurringPayment,
      color: color || 'blue',
      category: category || 'Other',
      nextPaymentDate: nextPaymentDate || null,
      linkToSavingsPlan: linkToSavingsPlan || false,
      monthlyAmount: monthlyAmount || 0,
      savingsExpenseId: savingsExpenseId,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subscription'
    });
  }
});

// @route   GET /api/subscriptions
// @desc    Get all subscriptions for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      recurringPayment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { user: req.user.id, isActive: true };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (recurringPayment && recurringPayment !== 'All') {
      query.recurringPayment = recurringPayment;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const subscriptions = await Subscription.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscriptions'
    });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get a specific subscription
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscription'
    });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update a subscription
// @access  Private
router.put('/:id', protect, [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('plan')
    .optional()
    .notEmpty()
    .withMessage('Plan cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Plan description cannot exceed 50 characters'),
  body('totalSpend')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total spend must be a positive number'),
  body('duration')
    .optional()
    .notEmpty()
    .withMessage('Duration cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Duration cannot exceed 50 characters'),
  body('recurringPayment')
    .optional()
    .isIn(['Yes', 'No'])
    .withMessage('Recurring payment must be Yes or No'),
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string'),
  body('category')
    .optional()
    .isIn(['Streaming', 'Software', 'Gym', 'Music', 'News', 'Other'])
    .withMessage('Invalid category'),
  body('nextPaymentDate')
    .optional()
    .isISO8601()
    .withMessage('Next payment date must be a valid ISO date'),
  body('linkToSavingsPlan')
    .optional()
    .isBoolean()
    .withMessage('linkToSavingsPlan must be a boolean'),
  body('monthlyAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly amount must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const { linkToSavingsPlan, monthlyAmount } = req.body;
    const updateData = { ...req.body };

    // Handle savings plan linking
    if (linkToSavingsPlan !== undefined || monthlyAmount !== undefined) {
      const shouldLink = linkToSavingsPlan !== undefined ? linkToSavingsPlan : subscription.linkToSavingsPlan;
      const amount = monthlyAmount !== undefined ? monthlyAmount : subscription.monthlyAmount;

      if (shouldLink && amount && amount > 0) {
        // Map subscription category to savings expense category
        const categoryMap = {
          'Streaming': 'Entertainment',
          'Software': 'Other',
          'Gym': 'Healthcare',
          'Music': 'Entertainment',
          'News': 'Other',
          'Other': 'Other'
        };
        
        const savingsCategory = categoryMap[subscription.category || 'Other'];
        
        if (subscription.savingsExpenseId) {
          // Update existing savings expense
          await SavingsExpense.findByIdAndUpdate(
            subscription.savingsExpenseId,
            {
              category: savingsCategory,
              perMonth: amount
            },
            { new: true, runValidators: true }
          );
        } else {
          // Create new savings expense
          const savingsExpense = await SavingsExpense.create({
            category: savingsCategory,
            perMonth: amount,
            user: req.user.id
          });
          updateData.savingsExpenseId = savingsExpense._id;
        }
      } else if (!shouldLink && subscription.savingsExpenseId) {
        // Unlink: delete the savings expense
        await SavingsExpense.findByIdAndDelete(subscription.savingsExpenseId);
        updateData.savingsExpenseId = null;
      } else if (shouldLink && subscription.savingsExpenseId && amount) {
        // Update amount if already linked
        await SavingsExpense.findByIdAndUpdate(
          subscription.savingsExpenseId,
          { perMonth: amount },
          { new: true, runValidators: true }
        );
      }
    }

    // Update subscription
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: updatedSubscription
      }
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subscription'
    });
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Delete a subscription (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // If linked to savings plan, delete the associated savings expense
    if (subscription.savingsExpenseId) {
      await SavingsExpense.findByIdAndDelete(subscription.savingsExpenseId);
    }

    // Soft delete
    subscription.isActive = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Subscription deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subscription'
    });
  }
});

// @route   GET /api/subscriptions/summary/overview
// @desc    Get subscription summary overview
// @access  Private
router.get('/summary/overview', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user: req.user.id,
      isActive: true
    });

    const totalSpend = subscriptions.reduce((sum, sub) => sum + sub.totalSpend, 0);
    const subscriptionCount = subscriptions.length;
    const recurringCount = subscriptions.filter(sub => sub.recurringPayment === 'Yes').length;

    // Category-wise breakdown
    const categoryBreakdown = {};
    subscriptions.forEach(subscription => {
      if (!categoryBreakdown[subscription.category]) {
        categoryBreakdown[subscription.category] = {
          totalSpend: 0,
          count: 0
        };
      }
      categoryBreakdown[subscription.category].totalSpend += subscription.totalSpend;
      categoryBreakdown[subscription.category].count += 1;
    });

    // Monthly recurring cost
    const monthlyRecurringCost = subscriptions
      .filter(sub => sub.recurringPayment === 'Yes')
      .reduce((sum, sub) => {
        // Extract monthly cost from plan string (e.g., "₹300/month" -> 300)
        const monthlyMatch = sub.plan.match(/(\d+)\/month/);
        if (monthlyMatch) {
          return sum + parseInt(monthlyMatch[1]);
        }
        return sum;
      }, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalSpend,
          subscriptionCount,
          recurringCount,
          monthlyRecurringCost
        },
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Subscription summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscription summary'
    });
  }
});

export default router; 