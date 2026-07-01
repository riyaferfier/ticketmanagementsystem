const { readDb, writeDb } = require('../db');

// US 2: Create Ticket
function createTicket(req, res) {
  const { title, description, category, priority, attachment } = req.body;
  const user = req.user;

  // Criteria 2: Mandatory Fields: Title, Description, Category
  if (!title || !description || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title, Description, and Category are mandatory fields.'
    });
  }

  const db = readDb();

  // Criteria 3: Ticket ID is generated automatically
  const existingCount = db.tickets.length;
  const nextNumber = 1001 + existingCount;
  const newId = `TCK-${nextNumber}`;

  const now = new Date().toISOString();

  const newTicket = {
    id: newId,
    title: title.trim(),
    description: description.trim(),
    category,
    priority: priority || 'Medium',
    // Criteria 4: Status defaults to "Open"
    status: 'Open',
    createdBy: user.email,
    createdByName: user.name,
    assignedTo: null,
    assignedToName: 'Unassigned',
    attachment: attachment || null,
    createdAt: now,
    updatedAt: now,
    comments: [],
    auditHistory: [
      {
        id: `aud-${Date.now()}-1`,
        action: 'Ticket Created',
        details: `Ticket created with default status "Open" in category "${category}"`,
        performedBy: user.name,
        timestamp: now
      }
    ]
  };

  db.tickets.unshift(newTicket);
  writeDb(db);

  // Criteria 5: Success message displayed after creation
  return res.status(201).json({
    success: true,
    message: `Ticket ${newId} created successfully!`,
    ticket: newTicket
  });
}

// US 3: View Tickets with Search, Filter by Status/Priority, and Sort by Created Date
function getTickets(req, res) {
  const { search, status, priority, sortBy, sortOrder } = req.query;
  const user = req.user;
  const db = readDb();

  let filtered = [...db.tickets];

  // If customer, show tickets created by them. If agent or admin, show all tickets.
  if (user.role === 'customer') {
    filtered = filtered.filter(t => t.createdBy.toLowerCase() === user.email.toLowerCase());
  } else if (user.role === 'agent') {
    // Agents can view all tickets or assigned tickets; let's return all so they can see general queue or filter by assigned
    if (req.query.assignedOnly === 'true') {
      filtered = filtered.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === user.email.toLowerCase());
    }
  }

  // Criteria 1: Search by Ticket ID or Title
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(q) || 
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }

  // Criteria 2: Filter by Status
  if (status && status !== 'All') {
    filtered = filtered.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }

  // Criteria 3: Filter by Priority
  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  // Criteria 4: Sort by Created Date
  filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortBy === 'oldest' || sortOrder === 'asc') {
      return dateA - dateB;
    }
    // Default: newest first
    return dateB - dateA;
  });

  return res.status(200).json({
    success: true,
    count: filtered.length,
    tickets: filtered
  });
}

function getTicketById(req, res) {
  const { id } = req.params;
  const db = readDb();
  const ticket = db.tickets.find(t => t.id.toLowerCase() === id.toLowerCase());

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  return res.status(200).json({ success: true, ticket });
}

// US 4: Update Ticket (Support Agent / Admin)
function updateTicket(req, res) {
  const { id } = req.params;
  const { status, priority, comment } = req.body;
  const user = req.user;

  const db = readDb();
  const ticketIndex = db.tickets.findIndex(t => t.id.toLowerCase() === id.toLowerCase());

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const ticket = db.tickets[ticketIndex];

  // If closed, read-only check (US 6 Criteria 3)
  if (ticket.status === 'Closed') {
    return res.status(403).json({
      success: false,
      message: 'Closed tickets are read-only and cannot be modified.'
    });
  }

  const now = new Date().toISOString();
  let statusChanged = false;
  let priorityChanged = false;

  // Criteria 1: Agent can change status
  if (status && status !== ticket.status) {
    const oldStatus = ticket.status;
    ticket.status = status;
    statusChanged = true;
    ticket.auditHistory.push({
      id: `aud-${Date.now()}-status`,
      action: 'Status Updated',
      details: `Status changed from "${oldStatus}" to "${status}"`,
      performedBy: `${user.name} (${user.role})`,
      timestamp: now
    });
  }

  // Criteria 2: Agent can update priority
  if (priority && priority !== ticket.priority) {
    const oldPriority = ticket.priority;
    ticket.priority = priority;
    priorityChanged = true;
    ticket.auditHistory.push({
      id: `aud-${Date.now()}-priority`,
      action: 'Priority Updated',
      details: `Priority changed from "${oldPriority}" to "${priority}"`,
      performedBy: `${user.name} (${user.role})`,
      timestamp: now
    });
  }

  // Criteria 3: Agent can add comments
  if (comment && comment.trim() !== '') {
    ticket.comments.push({
      id: `cmt-${Date.now()}`,
      author: user.name,
      role: user.role,
      text: comment.trim(),
      createdAt: now
    });
    ticket.auditHistory.push({
      id: `aud-${Date.now()}-comment`,
      action: 'Comment Added',
      details: `Comment added by ${user.name}`,
      performedBy: `${user.name} (${user.role})`,
      timestamp: now
    });
  }

  ticket.updatedAt = now;
  writeDb(db);

  return res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    ticket
  });
}

// US 6: Close Ticket (Customer)
function closeTicket(req, res) {
  const { id } = req.params;
  const { closureReason } = req.body;
  const user = req.user;

  const db = readDb();
  const ticketIndex = db.tickets.findIndex(t => t.id.toLowerCase() === id.toLowerCase());

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const ticket = db.tickets[ticketIndex];

  // Criteria 1: Only resolved tickets can be closed
  if (ticket.status !== 'Resolved') {
    return res.status(400).json({
      success: false,
      message: `Only tickets with status "Resolved" can be closed. Current status is "${ticket.status}".`
    });
  }

  // Criteria 2: Closure reason is mandatory
  if (!closureReason || closureReason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Closure reason is mandatory when closing a ticket.'
    });
  }

  const now = new Date().toISOString();
  ticket.status = 'Closed';
  ticket.closureReason = closureReason.trim();
  ticket.updatedAt = now;

  // Criteria 4: Audit history maintained and accessible
  ticket.auditHistory.push({
    id: `aud-${Date.now()}-close`,
    action: 'Ticket Closed',
    details: `Ticket closed by customer with reason: "${closureReason.trim()}"`,
    performedBy: user.name,
    timestamp: now
  });

  writeDb(db);

  // Criteria 3: Closed tickets become read-only (enforced in update endpoints and frontend UI)
  return res.status(200).json({
    success: true,
    message: 'Ticket closed successfully. This ticket is now archived as read-only.',
    ticket
  });
}

function addComment(req, res) {
  const { id } = req.params;
  const { text } = req.body;
  const user = req.user;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
  }

  const db = readDb();
  const ticket = db.tickets.find(t => t.id.toLowerCase() === id.toLowerCase());

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  if (ticket.status === 'Closed') {
    return res.status(403).json({ success: false, message: 'Cannot add comments to closed tickets.' });
  }

  const now = new Date().toISOString();
  const newComment = {
    id: `cmt-${Date.now()}`,
    author: user.name,
    role: user.role,
    text: text.trim(),
    createdAt: now
  };

  ticket.comments.push(newComment);
  ticket.auditHistory.push({
    id: `aud-${Date.now()}-comment`,
    action: 'Comment Added',
    details: `Comment added by ${user.name}`,
    performedBy: `${user.name} (${user.role})`,
    timestamp: now
  });
  ticket.updatedAt = now;

  writeDb(db);

  return res.status(201).json({ success: true, comment: newComment, ticket });
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  closeTicket,
  addComment
};
