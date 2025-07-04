// MSW Server Setup for LegalPro v1.0.1 - API Mocking
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'client@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'client',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'advocate@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'advocate',
    licenseNumber: 'ADV123',
    specialization: ['Civil Law', 'Criminal Law'],
    experience: 10,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

const mockCases = [
  {
    id: '1',
    clientId: '1',
    title: 'Contract Dispute',
    description: 'Dispute over contract terms',
    category: 'Civil',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '2',
    documents: [],
    notes: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

const mockAppointments = [
  {
    id: '1',
    clientId: '1',
    advocateId: '2',
    title: 'Initial Consultation',
    description: 'First meeting to discuss the case',
    date: '2023-12-01',
    time: '10:00',
    duration: 60,
    status: 'scheduled',
    type: 'consultation',
    location: 'Office',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: mockUsers[0],
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        user: mockUsers[0],
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: mockUsers[0]
      })
    );
  }),

  // Cases endpoints
  rest.get('/api/cases', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        cases: mockCases,
        total: mockCases.length
      })
    );
  }),

  rest.get('/api/cases/:id', (req, res, ctx) => {
    const { id } = req.params;
    const case_ = mockCases.find(c => c.id === id);
    
    if (!case_) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Case not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        case: case_
      })
    );
  }),

  rest.post('/api/cases', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        case: {
          ...mockCases[0],
          id: Date.now().toString()
        }
      })
    );
  }),

  rest.put('/api/cases/:id', (req, res, ctx) => {
    const { id } = req.params;
    const case_ = mockCases.find(c => c.id === id);
    
    if (!case_) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Case not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        case: {
          ...case_,
          updatedAt: new Date().toISOString()
        }
      })
    );
  }),

  rest.delete('/api/cases/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // Appointments endpoints
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        appointments: mockAppointments,
        total: mockAppointments.length
      })
    );
  }),

  rest.get('/api/appointments/:id', (req, res, ctx) => {
    const { id } = req.params;
    const appointment = mockAppointments.find(a => a.id === id);
    
    if (!appointment) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Appointment not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        appointment
      })
    );
  }),

  rest.post('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        appointment: {
          ...mockAppointments[0],
          id: Date.now().toString()
        }
      })
    );
  }),

  rest.put('/api/appointments/:id', (req, res, ctx) => {
    const { id } = req.params;
    const appointment = mockAppointments.find(a => a.id === id);
    
    if (!appointment) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Appointment not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        appointment: {
          ...appointment,
          updatedAt: new Date().toISOString()
        }
      })
    );
  }),

  rest.delete('/api/appointments/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/dashboard', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          totalCases: 15,
          activeCases: 8,
          completedCases: 7,
          upcomingAppointments: 3,
          recentActivity: [
            {
              id: '1',
              type: 'case_update',
              message: 'Case "Contract Dispute" status updated',
              timestamp: '2023-11-01T10:00:00Z'
            }
          ]
        }
      })
    );
  }),

  // File upload endpoints
  rest.post('/api/files/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        files: [
          {
            id: Date.now().toString(),
            name: 'document.pdf',
            size: 1024000,
            type: 'application/pdf',
            url: 'https://example.com/document.pdf',
            status: 'completed'
          }
        ]
      })
    );
  }),

  // Notification endpoints
  rest.post('/api/notifications/send', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        notificationId: Date.now().toString()
      })
    );
  }),

  // Error simulation endpoints
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({ error: 'Not found' })
    );
  }),

  rest.get('/api/error/timeout', (req, res, ctx) => {
    return res(
      ctx.delay('infinite')
    );
  })
];

// Create server instance
export const server = setupServer(...handlers);
