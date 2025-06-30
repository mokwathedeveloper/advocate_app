# 📋 LegalPro Codebase Index v1.0.1

## 🏗️ Project Overview
**LegalPro** is a comprehensive advocate case management system built with modern web technologies. This index provides a complete overview of the codebase structure, components, and functionality.

## 🎯 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Form Handling**: React Hook Form
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **SMS**: Twilio
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
advocate_app/
├── 📄 Documentation & Config
│   ├── README.md                    # Main project documentation
│   ├── CODE_INDEX.md               # Codebase structure guide
│   ├── CHANGELOG.md                # Version history
│   ├── CONTRIBUTING.md             # Contribution guidelines
│   ├── CODE_OF_CONDUCT.md          # Community standards
│   ├── DEPLOYMENT.md               # Deployment instructions
│   └── IMPLEMENTATION_PLAN.md      # Development roadmap
│
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Layout/            # Layout components
│   │   │   │   ├── Layout.tsx     # Main layout wrapper
│   │   │   │   ├── Navbar.tsx     # Navigation bar
│   │   │   │   └── Footer.tsx     # Site footer
│   │   │   ├── ui/                # Basic UI components
│   │   │   │   ├── Button.tsx     # Reusable button
│   │   │   │   ├── Card.tsx       # Card container
│   │   │   │   └── Input.tsx      # Form input (with forwardRef)
│   │   │   ├── calendar/          # Calendar components
│   │   │   │   └── CalendarWidget.tsx
│   │   │   ├── files/             # File handling
│   │   │   └── payments/          # Payment components
│   │   ├── pages/                 # Page components
│   │   │   ├── Home.tsx           # Landing page
│   │   │   ├── About.tsx          # About page
│   │   │   ├── Dashboard.tsx      # User dashboard
│   │   │   ├── Cases.tsx          # Case management
│   │   │   ├── Appointments.tsx   # Appointment scheduling
│   │   │   ├── Messages.tsx       # Chat interface
│   │   │   ├── AdminManagement.tsx # Admin panel
│   │   │   └── auth/              # Authentication pages
│   │   │       ├── Login.tsx      # Login form
│   │   │       └── Register.tsx   # Registration form
│   │   ├── contexts/              # React contexts
│   │   │   └── AuthContext.tsx    # Authentication state
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── useApi.ts          # API state management
│   │   ├── services/              # API services
│   │   │   ├── apiService.ts      # Main API client
│   │   │   ├── authService.ts     # Authentication API
│   │   │   └── paymentService.ts  # Payment API
│   │   ├── types/                 # TypeScript definitions
│   │   │   └── index.ts           # Type definitions
│   │   ├── App.tsx                # Main app component
│   │   ├── main.tsx               # App entry point
│   │   ├── index.css              # Global styles
│   │   └── vite-env.d.ts          # Vite type definitions
│   ├── index.html                 # HTML template
│   ├── package.json               # Frontend dependencies
│   ├── package-lock.json          # Dependency lock file
│   ├── vite.config.ts             # Vite configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── tsconfig.json              # TypeScript config
│   ├── tsconfig.app.json          # App-specific TS config
│   ├── tsconfig.node.json         # Node-specific TS config
│   └── eslint.config.js           # ESLint configuration
│
├── 🔧 Backend (Node.js + Express)
│   ├── backend/
│   │   ├── controllers/           # Route controllers
│   │   │   ├── authController.js  # Authentication logic
│   │   │   ├── caseController.js  # Case management
│   │   │   ├── appointmentController.js # Appointments
│   │   │   ├── chatController.js  # Chat functionality
│   │   │   ├── dashboardController.js # Dashboard data
│   │   │   └── paymentController.js # Payment processing
│   │   ├── models/                # Database models
│   │   │   ├── User.js            # User schema
│   │   │   ├── Case.js            # Case schema
│   │   │   ├── Appointment.js     # Appointment schema
│   │   │   ├── ChatMessage.js     # Chat message schema
│   │   │   └── Payment.js         # Payment schema
│   │   ├── routes/                # API routes
│   │   │   ├── auth.js            # Authentication routes
│   │   │   ├── cases.js           # Case management routes
│   │   │   ├── appointments.js    # Appointment routes
│   │   │   ├── chat.js            # Chat routes
│   │   │   ├── dashboard.js       # Dashboard routes
│   │   │   └── payments.js        # Payment routes
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── validation.js      # Input validation
│   │   │   ├── upload.js          # File upload handling
│   │   │   ├── errorHandler.js    # Error handling
│   │   │   └── notFound.js        # 404 handler
│   │   ├── utils/                 # Utility functions
│   │   │   ├── auth.js            # Auth utilities
│   │   │   ├── email.js           # Email service
│   │   │   ├── sms.js             # SMS service
│   │   │   ├── mpesaService.js    # M-Pesa integration
│   │   │   └── notificationService.js # Notifications
│   │   ├── config/                # Configuration
│   │   │   └── cloudinary.js      # Cloudinary setup
│   │   ├── socket/                # Socket.IO handlers
│   │   │   └── socketHandler.js   # Real-time communication
│   │   ├── scripts/               # Database scripts
│   │   │   └── seedDatabase.js    # Database seeding
│   │   ├── server.js              # Main server file
│   │   ├── package.json           # Backend dependencies
│   │   ├── package-lock.json      # Backend lock file
│   │   ├── .env.example           # Environment template
│   │   └── README.md              # Backend documentation
│
├── 🚀 DevOps & Automation
│   ├── .github/
│   │   └── workflows/
│   │       └── ci.yml             # CI/CD pipeline
│   └── scripts/                   # Automation scripts
│       ├── git-workflow.sh        # Git automation
│       ├── create-feature-branch.sh # Branch creation
│       ├── create-pull-request.sh # PR automation
│       ├── release.sh             # Release deployment
│       ├── release-notes.sh       # Release notes generation
│       ├── setup-repository.sh    # Repository setup
│       └── pr-template.md         # PR template
│
└── 📊 Additional Files
    ├── cookies.txt                # HTTP cookies config
    └── .gitignore                 # Git ignore patterns
```

## 🔑 Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Client, Advocate, Admin)
- Protected routes and middleware
- Password hashing with bcrypt

### 📋 Case Management
- CRUD operations for legal cases
- Client information tracking
- Case status management
- Document upload and storage
- Case timeline and notes

### 📅 Appointment Scheduling
- Calendar integration
- Client-advocate meeting scheduling
- Time slot management
- Appointment notifications

### 💬 Real-time Communication
- Socket.IO-based chat system
- Client-advocate messaging
- Message history and status
- Real-time notifications

### 💳 Payment Processing
- M-Pesa Daraja API integration
- Payment tracking and history
- Billing management
- Transaction notifications

### 📊 Dashboard & Analytics
- Case statistics and metrics
- Appointment overview
- Recent activities
- Performance analytics

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - Get all cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get specific case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Chat
- `GET /api/chat/messages` - Get messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/read` - Mark as read

### Payments
- `GET /api/payments` - Get payment history
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment details

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/health` - Health check

## 🔧 Development Setup

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/mokwathedeveloper/advocate_app.git
cd advocate_app

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev  # Frontend (port 5173)
cd backend && npm run dev  # Backend (port 5001)
```

## 📝 Recent Updates
- ✅ Fixed React ref warnings with forwardRef implementation
- ✅ Resolved CORS issues for frontend-backend communication
- ✅ Updated API URLs to use correct port (5001)
- ✅ Enhanced CORS configuration for better cross-origin support
- ✅ Implemented complete dashboard controller with data aggregation
- ✅ All 84+ files committed individually with descriptive messages

## 🎯 Current Status
- **Frontend**: ✅ Running on http://localhost:5173
- **Backend**: ✅ Running on http://localhost:5001
- **Database**: ✅ Connected to MongoDB Atlas
- **Authentication**: ✅ JWT system operational
- **API Communication**: ✅ CORS resolved, all endpoints working
- **File Structure**: ✅ Complete and organized
- **Git Repository**: ✅ All files committed individually

---
*Last Updated: June 30, 2025 - LegalPro v1.0.1*
