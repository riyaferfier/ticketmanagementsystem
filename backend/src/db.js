const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');

const initialData = {
  users: [
    {
      id: 'usr-1',
      name: 'Alice Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      status: 'active',
      failedAttempts: 0,
      locked: false
    },
    {
      id: 'usr-2',
      name: 'Bob Support Agent',
      email: 'agent@test.com',
      password: 'password123',
      role: 'agent',
      status: 'active',
      failedAttempts: 0,
      locked: false
    },
    {
      id: 'usr-3',
      name: 'Charlie Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
      failedAttempts: 0,
      locked: false
    }
  ],
  tickets: [
    {
      id: 'TCK-1001',
      title: 'Cannot access my billing invoice',
      description: 'When I click on the invoice link for last month, I get a 404 error page. Please help resolve this.',
      category: 'Billing',
      priority: 'High',
      status: 'Open',
      createdBy: 'customer@test.com',
      createdByName: 'Alice Customer',
      assignedTo: 'agent@test.com',
      assignedToName: 'Bob Support Agent',
      attachment: 'invoice_error_screenshot.png',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      comments: [
        {
          id: 'cmt-1',
          author: 'Alice Customer',
          role: 'customer',
          text: 'I really need this for my company tax filing by tomorrow.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString()
        }
      ],
      auditHistory: [
        {
          id: 'aud-1',
          action: 'Ticket Created',
          details: 'Ticket created with default status "Open"',
          performedBy: 'Alice Customer',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
        },
        {
          id: 'aud-2',
          action: 'Ticket Assigned',
          details: 'Assigned to Bob Support Agent by Charlie Admin',
          performedBy: 'Charlie Admin',
          timestamp: new Date(Date.now() - 3600000 * 24 * 1.8).toISOString()
        }
      ]
    },
    {
      id: 'TCK-1002',
      title: 'Feature request: Dark mode export',
      description: 'It would be great if we could export reports in PDF while maintaining the dark mode styling.',
      category: 'Feature Request',
      priority: 'Low',
      status: 'In Progress',
      createdBy: 'customer@test.com',
      createdByName: 'Alice Customer',
      assignedTo: 'agent@test.com',
      assignedToName: 'Bob Support Agent',
      attachment: null,
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      comments: [
        {
          id: 'cmt-2',
          author: 'Bob Support Agent',
          role: 'agent',
          text: 'We are evaluating this with the frontend product team right now.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
        }
      ],
      auditHistory: [
        {
          id: 'aud-3',
          action: 'Ticket Created',
          details: 'Ticket created with default status "Open"',
          performedBy: 'Alice Customer',
          timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
        },
        {
          id: 'aud-4',
          action: 'Status Updated',
          details: 'Status changed from Open to In Progress',
          performedBy: 'Bob Support Agent',
          timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
        }
      ]
    },
    {
      id: 'TCK-1003',
      title: 'Login page loading slowly on mobile',
      description: 'The login page takes over 5 seconds to render when loading over 4G cellular data.',
      category: 'Technical',
      priority: 'Medium',
      status: 'Resolved',
      createdBy: 'customer@test.com',
      createdByName: 'Alice Customer',
      assignedTo: 'agent@test.com',
      assignedToName: 'Bob Support Agent',
      attachment: null,
      createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      comments: [
        {
          id: 'cmt-3',
          author: 'Bob Support Agent',
          role: 'agent',
          text: 'We optimized asset bundling and reduced bundle size by 45%. Please test again.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        }
      ],
      auditHistory: [
        {
          id: 'aud-5',
          action: 'Ticket Created',
          details: 'Ticket created with default status "Open"',
          performedBy: 'Alice Customer',
          timestamp: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
        },
        {
          id: 'aud-6',
          action: 'Status Updated',
          details: 'Status changed from Open to Resolved',
          performedBy: 'Bob Support Agent',
          timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        }
      ]
    }
  ],
  categories: ['Technical', 'Billing', 'Account', 'Feature Request', 'General Inquiry'],
  priorities: ['Low', 'Medium', 'High', 'Urgent'],
  notifications: [
    {
      id: 'notif-1',
      recipient: 'agent@test.com',
      message: 'You have been assigned to ticket TCK-1001 by Charlie Admin.',
      createdAt: new Date(Date.now() - 3600000 * 24 * 1.8).toISOString(),
      read: false
    }
  ]
};

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('Database initialized with default data at:', DB_PATH);
  }
}

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    initDb();
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  initDb,
  readDb,
  writeDb
};
