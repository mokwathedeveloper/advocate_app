# Code Index - LegalPro v1.0.1 - Advocate Case Management System

## Project Overview
A full-stack case management system for legal professionals built with React (TypeScript) frontend and Node.js/Express backend.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **Routing**: React Router v6
- **UI Components**: Custom components with Framer Motion animations

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **SMS**: Twilio

## Directory Structure

### Frontend (`/src`)
```
src/
├── components/         # Reusable UI components
│   ├── calendar/      # Calendar-related components
│   ├── files/         # File upload components
│   ├── Layout/        # Layout components (Navbar, Footer)
│   ├── payments/      # Payment-related components
│   └── ui/            # Basic UI components
├── contexts/          # React contexts (Auth)
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   └── auth/          # Authentication pages
├── services/          # API services
└── types/             # TypeScript type definitions
```

### Backend (`/backend`)
```
backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── scripts/         # Database scripts
├── socket/          # Socket.IO handlers
└── utils/           # Utility functions
```

## Core Features

### 1. Authentication & Authorization
- User roles: advocate (super admin), admin, client
- JWT-based authentication with token expiration
- Protected routes with role-based access
- Comprehensive user management:
  - Registration with role-specific fields
  - Secure login with password hashing
  - Password reset functionality
  - Profile updates
  - Account verification for advocates
- Security features:
  - Bcrypt password hashing
  - JWT token signing
  - Password reset tokens
  - Last login tracking
  - Account status management (active/inactive)

Authentication Endpoints:
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/me          # Get current user
PUT  /api/auth/updatedetails    # Update user details
PUT  /api/auth/updatepassword   # Update password
POST /api/auth/forgotpassword   # Request password reset
PUT  /api/auth/resetpassword    # Reset password
```

User Model Fields:
```javascript
{
  firstName: String,        // Required, max 50 chars
  lastName: String,         // Required, max 50 chars
  email: String,           // Required, unique, validated
  password: String,        // Required, min 6 chars, hashed
  role: String,           // ['advocate', 'admin', 'client']
  phone: String,          // Optional
  avatar: String,         // Optional
  
  // Advocate-specific fields
  licenseNumber: String,  // Required for advocates
  specialization: [String],
  experience: Number,
  education: String,
  barAdmission: String,
  isVerified: Boolean,    // Default false for advocates
  
  // System fields
  isActive: Boolean,      // Account status
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```


### 2. Case Management
- Case creation and tracking
- Document management
- Case notes and updates
- Court date tracking
- Priority levels

### 3. Appointment System
- Scheduling consultations
- Follow-up appointments
- Court appearances
- Integration with payments

### 4. Communication
- Real-time chat
- File sharing
- Email notifications
- SMS alerts

### 5. Payment Processing
- Multiple payment methods
- Appointment fee handling
- Transaction tracking
- Payment status management

### 6. Document Management
- File upload/download
- Cloud storage integration
- Document categorization
- Access control

## API Endpoints

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`

### Cases
- GET `/api/cases`
- POST `/api/cases`
- GET `/api/cases/:id`
- PUT `/api/cases/:id`
- DELETE `/api/cases/:id`

### Appointments
- GET `/api/appointments`
- POST `/api/appointments`
- PUT `/api/appointments/:id`
- DELETE `/api/appointments/:id`

### Payments
- GET `/api/payments`
- POST `/api/payments`
- GET `/api/payments/:id`

### Chat
- GET `/api/chat/messages`
- POST `/api/chat/messages`
- PUT `/api/chat/messages/read`

### Dashboard
- GET `/api/dashboard/stats`
- GET `/api/dashboard/recent-activities`

## Data Models

### User
- Basic info (name, email, phone)
- Role-based fields
- Professional details for advocates

### Case
- Client information
- Case details and status
- Document references
- Notes and updates

### Appointment
- Scheduling details
- Type and status
- Payment integration
- Location/meeting link

### Payment
- Transaction details
- Status tracking
- Multiple payment methods

### ChatMessage
- Real-time messaging
- File sharing
- Read status tracking

## Security Features
- CORS protection
- Rate limiting
- XSS prevention
- MongoDB injection protection
- Helmet security headers
- Data sanitization
- Parameter pollution protection

## Development Scripts

### Frontend
```bash
npm run dev        # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend
```bash
npm run start     # Start production server
npm run dev       # Start development server with nodemon
npm run test      # Run tests
npm run seed      # Seed database with initial data
```

## Environment Variables
Required environment variables for the application:

### Backend
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `CLIENT_URL`: Frontend URL for CORS
- `CLOUDINARY_*`: Cloudinary credentials
- `EMAIL_*`: Email service credentials
- `TWILIO_*`: Twilio credentials

### Frontend
- `VITE_API_URL`: Backend API URL
- `VITE_SOCKET_URL`: WebSocket server URL

## Contributing
See `CONTRIBUTING.md` for contribution guidelines and `CODE_OF_CONDUCT.md` for code of conduct.
