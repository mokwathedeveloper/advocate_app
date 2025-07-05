# LegalPro - Advocate Case Management System v1.0.1

[![CI/CD Pipeline](https://github.com/mokwathedeveloper/advocate_app/actions/workflows/ci.yml/badge.svg)](https://github.com/mokwathedeveloper/advocate_app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/mokwathedeveloper/advocate_app/releases)

A comprehensive case management system designed specifically for legal professionals and law firms. Built with modern web technologies to streamline legal practice management.

## 🚀 Features

### For Legal Professionals
- **Case Management**: Complete case lifecycle management with document storage
- **Client Portal**: Secure client access to case information and updates
- **Appointment Scheduling**: Integrated calendar with automated reminders
- **Document Management**: Secure file upload, storage, and sharing
- **Payment Integration**: Comprehensive M-Pesa Daraja API integration with STK Push, B2C refunds, and transaction tracking
- **Real-time Communication**: Built-in messaging system
- **Reporting & Analytics**: Comprehensive case and financial reporting

### For Clients
- **Dashboard**: Overview of all cases and appointments
- **Case Tracking**: Real-time updates on case progress
- **Document Access**: Secure access to case-related documents
- **Online Payments**: Seamless M-Pesa payments with real-time status updates
- **Appointment Booking**: Self-service appointment scheduling
- **Communication**: Direct messaging with legal team

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **React Hook Form** for form management
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Cloudinary** for file storage
- **Nodemailer** for email notifications
- **M-Pesa Daraja API** for payment processing

### DevOps & Tools
- **GitHub Actions** for CI/CD
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/mokwathedeveloper/advocate_app.git
cd advocate_app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 4. Configure Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### Backend (backend/.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/advocate_app
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment (M-Pesa)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

### 5. Start the Application
```bash
# Start backend server
cd backend
npm run dev

# In a new terminal, start frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
advocate_app/
├── src/                    # Frontend source code
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/               # Backend source code
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── config/           # Configuration files
├── scripts/              # Build and deployment scripts
├── .github/              # GitHub workflows and templates
└── docs/                 # Documentation
```

## 🔧 Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run seed         # Seed database with sample data
```

### Git Workflow

We use a feature-branch workflow. Use the provided scripts for common operations:

```bash
# Create a new feature branch
./scripts/git-workflow.sh feature user-authentication

# Finish a feature (commit and push)
./scripts/git-workflow.sh finish

# Create a release
./scripts/git-workflow.sh release 1.1.0

# Create a tag
./scripts/git-workflow.sh tag 1.1.0 "New features and bug fixes"
```

## 💳 M-Pesa Payment Integration

LegalPro features a comprehensive M-Pesa Daraja API integration for seamless payment processing in the Kenyan market.

### Features
- **STK Push Payments**: Direct payment requests to customer phones
- **Real-time Status Updates**: Live payment status tracking with auto-refresh
- **B2C Refunds**: Automated refund processing for administrators
- **Transaction Logging**: Comprehensive audit trail for all transactions
- **Multi-step Payment UI**: Professional payment flow with progress indicators
- **Retry Mechanisms**: Automatic retry for failed transactions

### Configuration
```env
# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/stk-callback
```

### Usage
```typescript
// Initiate payment
import { PaymentModal } from './components/payments';

<PaymentModal
  defaultAmount={1000}
  defaultPaymentType="consultation_fee"
  onPaymentSuccess={(paymentId) => handleSuccess(paymentId)}
  onClose={() => setShowModal(false)}
/>
```

For detailed integration guide, see [MPESA_INTEGRATION_GUIDE.md](./MPESA_INTEGRATION_GUIDE.md)

## 🧪 Testing

### Frontend Testing
```bash
npm test                    # Run all tests
npm run test:coverage      # Run tests with coverage
npm run test:watch         # Run tests in watch mode
```

### Backend Testing
```bash
cd backend
npm test                   # Run all tests
npm test mpesa.test.js     # Run M-Pesa specific tests
npm run test:integration   # Run integration tests
npm run test:unit         # Run unit tests
```

### M-Pesa Testing
```bash
# Run M-Pesa integration tests
cd backend
npm test mpesa.test.js

# Manual testing with sandbox
# See MPESA_INTEGRATION_SPECS.md for detailed testing procedures
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# The build files will be in the `dist` directory
```

### Environment Variables for Production
Ensure all environment variables are properly set in your production environment.

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📖 API Documentation

The API documentation is available at `/api/docs` when running the backend server.

### Authentication
All API endpoints (except public ones) require authentication via JWT token:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Case Management
- `GET /api/cases` - Get user cases
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case

#### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get user appointments

#### Payments (M-Pesa)
- `POST /api/payments/stk-push` - Initiate STK Push payment
- `GET /api/payments/:id/status` - Query payment status
- `GET /api/payments` - Get payment history
- `POST /api/payments/:id/refund` - Initiate refund (admin only)
- `GET /api/payments/analytics` - Get transaction analytics (admin only)

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](https://github.com/mokwathedeveloper/advocate_app/wiki)
2. Search [existing issues](https://github.com/mokwathedeveloper/advocate_app/issues)
3. Create a [new issue](https://github.com/mokwathedeveloper/advocate_app/issues/new/choose)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library

## 📊 Project Status

- ✅ User Authentication & Authorization
- ✅ Case Management System
- ✅ Appointment Scheduling
- ✅ Client Dashboard
- ✅ Document Management
- ✅ M-Pesa Payment Integration
- ✅ Real-time Chat System
- 📋 Email Notifications (Planned)
- 📋 Mobile App (Planned)

---

**Made with  by the LegalPro Team**