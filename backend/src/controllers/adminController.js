const { readDb, writeDb } = require('../db');

// Get all users (Admin only)
function getUsers(req, res) {
  const db = readDb();
  // Return users without passwords
  const users = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    failedAttempts: u.failedAttempts,
    locked: u.locked
  }));
  return res.status(200).json({ success: true, users });
}

// Unlock locked account or update user status/role
function updateUser(req, res) {
  const { id } = req.params;
  const { locked, status, role, name } = req.body;
  const db = readDb();

  const user = db.users.find(u => u.id === id || u.email.toLowerCase() === id.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (locked !== undefined) {
    user.locked = locked;
    if (!locked) {
      user.failedAttempts = 0; // Reset attempts when unlocked
    }
  }

  if (status !== undefined) user.status = status;
  if (role !== undefined) user.role = role;
  if (name !== undefined) user.name = name;

  writeDb(db);

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      locked: user.locked,
      failedAttempts: user.failedAttempts
    }
  });
}

// US 5: Assign Ticket to Active Agent
function assignTicket(req, res) {
  const { ticketId } = req.params;
  const { agentEmail } = req.body;
  const admin = req.user;

  if (!agentEmail) {
    return res.status(400).json({ success: false, message: 'Agent email is required.' });
  }

  const db = readDb();

  // Criteria 1: Ticket can be assigned to active agents only
  const agent = db.users.find(u => 
    u.email.toLowerCase() === agentEmail.toLowerCase() && 
    u.role === 'agent' && 
    u.status === 'active' && 
    !u.locked
  );

  if (!agent) {
    return res.status(400).json({
      success: false,
      message: 'Ticket can be assigned to active support agents only.'
    });
  }

  const ticket = db.tickets.find(t => t.id.toLowerCase() === ticketId.toLowerCase());
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  if (ticket.status === 'Closed') {
    return res.status(403).json({ success: false, message: 'Closed tickets are read-only and cannot be reassigned.' });
  }

  const oldAssignee = ticket.assignedToName || 'Unassigned';
  ticket.assignedTo = agent.email;
  ticket.assignedToName = agent.name;
  const now = new Date().toISOString();
  ticket.updatedAt = now;

  // Criteria 3: Assignment history is maintained
  ticket.auditHistory.push({
    id: `aud-${Date.now()}-assign`,
    action: 'Ticket Assigned',
    details: `Assigned to ${agent.name} (previously ${oldAssignee}) by ${admin.name}`,
    performedBy: `${admin.name} (Admin)`,
    timestamp: now
  });

  // Criteria 2: Assignment notification is sent
  const newNotif = {
    id: `notif-${Date.now()}`,
    recipient: agent.email,
    message: `New ticket assigned: [${ticket.id}] "${ticket.title}" assigned to you by ${admin.name}.`,
    createdAt: now,
    read: false
  };
  db.notifications.unshift(newNotif);

  writeDb(db);

  return res.status(200).json({
    success: true,
    message: `Ticket ${ticket.id} assigned to ${agent.name} successfully. Notification sent!`,
    ticket,
    notification: newNotif
  });
}

// Get system config (Categories & Priorities)
function getConfig(req, res) {
  const db = readDb();
  return res.status(200).json({
    success: true,
    categories: db.categories || ['Technical', 'Billing', 'Account', 'Feature Request', 'General Inquiry'],
    priorities: db.priorities || ['Low', 'Medium', 'High', 'Urgent']
  });
}

// Configure categories or priorities
function updateConfig(req, res) {
  const { categories, priorities } = req.body;
  const db = readDb();

  if (categories && Array.isArray(categories)) {
    db.categories = categories;
  }
  if (priorities && Array.isArray(priorities)) {
    db.priorities = priorities;
  }

  writeDb(db);
  return res.status(200).json({
    success: true,
    message: 'Configuration updated successfully.',
    categories: db.categories,
    priorities: db.priorities
  });
}

// Get analytics / report summary
function getReports(req, res) {
  const db = readDb();
  const total = db.tickets.length;
  const open = db.tickets.filter(t => t.status === 'Open').length;
  const inProgress = db.tickets.filter(t => t.status === 'In Progress').length;
  const resolved = db.tickets.filter(t => t.status === 'Resolved').length;
  const closed = db.tickets.filter(t => t.status === 'Closed').length;

  // Tickets by category
  const byCategory = {};
  (db.categories || []).forEach(cat => {
    byCategory[cat] = db.tickets.filter(t => t.category === cat).length;
  });

  // Tickets by priority
  const byPriority = {};
  (db.priorities || []).forEach(pri => {
    byPriority[pri] = db.tickets.filter(t => t.priority === pri).length;
  });

  return res.status(200).json({
    success: true,
    stats: {
      total,
      open,
      inProgress,
      resolved,
      closed,
      byCategory,
      byPriority
    }
  });
}

// Get notifications for current logged in user
function getNotifications(req, res) {
  const user = req.user;
  const db = readDb();
  const myNotifs = (db.notifications || []).filter(n => n.recipient.toLowerCase() === user.email.toLowerCase());
  return res.status(200).json({ success: true, notifications: myNotifs });
}

module.exports = {
  getUsers,
  updateUser,
  assignTicket,
  getConfig,
  updateConfig,
  getReports,
  getNotifications
};
