# Budget-Mate

A full-stack budget management application built with React (Frontend) and Node.js/Express (Backend).

## Features

- 📊 **Dashboard**: Overview of budgets, expenses, and spending analytics
- 💰 **Budget Management**: Create and manage multiple budgets
- 💸 **Expense Tracking**: Track expenses by category
- 📈 **Analytics**: Detailed expense analytics and insights
- 💾 **Savings Plan**: Plan and track your savings goals
- 📱 **Subscriptions**: Manage recurring subscriptions
- 🔐 **Authentication**: Secure user authentication with JWT

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Recharts (for analytics charts)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs (password hashing)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Budget-Mate-main
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install:all
   ```

   Or install manually:
   ```bash
   npm install
   cd Backend && npm install
   cd ../Frontend && npm install
   ```

3. **Configure Environment Variables**

   **Backend** (`Backend/config.env`):
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend** (`Frontend/.env`):
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

## Running the Application

### Development Mode

Run both frontend and backend together:
```bash
npm run dev
```

Or run them separately:

**Backend:**
```bash
cd Backend
npm run dev
```

**Frontend:**
```bash
cd Frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Update Backend config.env:**
   ```
   NODE_ENV=production
   FRONTEND_URL=your_frontend_url
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```

   Or:
   ```bash
   cd Backend
   npm start
   ```

The backend will serve both the API and the built frontend application.

## Project Structure

```
Budget-Mate-main/
├── Backend/
│   ├── config.env          # Environment variables
│   ├── server.js           # Express server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── middleware/         # Auth middleware
├── Frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service files
│   │   └── App.jsx         # Main app component
│   └── vite.config.js      # Vite configuration
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/quick-stats` - Get quick statistics

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Savings
- `GET /api/savings/summary` - Get savings summary
- `POST /api/savings/income` - Add income
- `POST /api/savings/expenses` - Add savings expense
- `POST /api/savings/budget` - Set monthly budget

### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/summary` - Get analytics summary

## Database Connection

The application uses MongoDB Atlas. Update the `MONGODB_URI` in `Backend/config.env` with your connection string.

## Security

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- API routes are protected with authentication middleware
- CORS is configured for production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the repository.

