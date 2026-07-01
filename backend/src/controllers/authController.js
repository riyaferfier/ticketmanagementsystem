const { readDb, writeDb } = require('../db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'playwright-ticket-secret-key';

function login(req, res) {
  const { email, password } = req.body;

  // Criteria 2: Email and password are mandatory
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are mandatory fields.' 
    });
  }

  const db = readDb();
  const userIndex = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

  if (userIndex === -1) {
    // Criteria 3: Invalid credentials should display an error message
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password.' 
    });
  }

  const user = db.users[userIndex];

  // Check if account is locked (Criteria 4)
  if (user.locked || user.failedAttempts >= 5) {
    return res.status(403).json({
      success: false,
      message: 'Account locked due to 5 failed login attempts. Please contact an Administrator to unlock your account.',
      locked: true
    });
  }

  // Check password
  if (user.password !== password) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    
    // Criteria 4: Lock account after 5 failed attempts
    if (user.failedAttempts >= 5) {
      user.locked = true;
      writeDb(db);
      return res.status(403).json({
        success: false,
        message: 'Account locked due to 5 failed login attempts. Please contact an Administrator to unlock your account.',
        locked: true
      });
    }

    writeDb(db);
    return res.status(401).json({
      success: false,
      message: `Invalid email or password. You have ${5 - user.failedAttempts} attempt(s) left before account lockout.`,
      attemptsLeft: 5 - user.failedAttempts
    });
  }

  // Success: reset failed attempts
  user.failedAttempts = 0;
  user.locked = false;
  writeDb(db);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  // Criteria 5: User is redirected to Dashboard after successful login (frontend handles redirect using role)
  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
}

function getMe(req, res) {
  const db = readDb();
  const user = db.users.find(u => u.email === req.user.email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
}

module.exports = {
  login,
  verifyToken,
  getMe,
  SECRET_KEY
};
