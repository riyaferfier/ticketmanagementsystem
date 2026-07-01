const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const auth = require('./controllers/authController');
const ticket = require('./controllers/ticketController');
const admin = require('./controllers/adminController');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
initDb();

// Public Auth routes
app.post('/api/auth/login', auth.login);

// Protected Auth routes
app.get('/api/auth/me', auth.verifyToken, auth.getMe);

// Ticket routes (Protected)
app.post('/api/tickets', auth.verifyToken, ticket.createTicket);
app.get('/api/tickets', auth.verifyToken, ticket.getTickets);
app.get('/api/tickets/:id', auth.verifyToken, ticket.getTicketById);
app.put('/api/tickets/:id', auth.verifyToken, ticket.updateTicket);
app.post('/api/tickets/:id/comments', auth.verifyToken, ticket.addComment);
app.post('/api/tickets/:id/close', auth.verifyToken, ticket.closeTicket);

// Admin / System routes (Protected)
app.get('/api/admin/users', auth.verifyToken, admin.getUsers);
app.put('/api/admin/users/:id', auth.verifyToken, admin.updateUser);
app.post('/api/admin/tickets/:ticketId/assign', auth.verifyToken, admin.assignTicket);
app.get('/api/admin/config', auth.verifyToken, admin.getConfig);
app.put('/api/admin/config', auth.verifyToken, admin.updateConfig);
app.get('/api/admin/reports', auth.verifyToken, admin.getReports);

// Notifications
app.get('/api/notifications', auth.verifyToken, admin.getNotifications);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Ticket Management Backend is running perfectly!' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Ticket Management Backend API Running on Port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
