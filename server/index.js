import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize SQLite database
const db = new Database('skillswap.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    profilePicture TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    experienceLevel TEXT,
    type TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS swap_requests (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    recipientId TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (recipientId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    user1Id TEXT NOT NULL,
    user2Id TEXT NOT NULL,
    requestId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (user1Id) REFERENCES users(id),
    FOREIGN KEY (user2Id) REFERENCES users(id),
    FOREIGN KEY (requestId) REFERENCES swap_requests(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    content TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (receiverId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    raterId TEXT NOT NULL,
    ratedUserId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (raterId) REFERENCES users(id),
    FOREIGN KEY (ratedUserId) REFERENCES users(id)
  );
`);

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Invalid or expired token'));
    }
    
    socket.user = user;
    next();
  });
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join a room with the user's ID
  socket.join(socket.user.id);
  
  // Broadcast user online status
  socket.broadcast.emit('user_status', {
    userId: socket.user.id,
    status: 'online'
  });
  
  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { receiverId, content } = data;
    
    // Create message in database
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO messages (id, senderId, receiverId, content, read, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(messageId, socket.user.id, receiverId, content, 0, timestamp);
    
    // Create message object
    const message = {
      id: messageId,
      senderId: socket.user.id,
      receiverId,
      content,
      timestamp,
      read: false
    };
    
    // Send to both sender and receiver
    io.to(socket.user.id).emit('new_message', message);
    io.to(receiverId).emit('new_message', message);
  });
  
  // Handle marking messages as read
  socket.on('mark_read', (data) => {
    const { messageId } = data;
    
    // Update message in database
    const stmt = db.prepare(`
      UPDATE messages SET read = 1
      WHERE id = ?
    `);
    
    stmt.run(messageId);
    
    // Get message details to notify sender
    const message = db.prepare(`
      SELECT senderId FROM messages
      WHERE id = ?
    `).get(messageId);
    
    if (message) {
      io.to(message.senderId).emit('message_read', messageId);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
    
    // Broadcast user offline status
    socket.broadcast.emit('user_status', {
      userId: socket.user.id,
      status: 'offline',
      lastSeen: new Date().toISOString()
    });
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if email already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, name, email, hashedPassword, createdAt);
    
    // Generate JWT
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        teachSkills: [],
        learnSkills: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Get user skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(user.id, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(user.id, 'learn');
    
    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data and token
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        profilePicture: user.profilePicture,
        teachSkills,
        learnSkills
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Routes
app.get('/api/users/me', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = db.prepare('SELECT id, name, email, bio, location, profilePicture, createdAt FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'learn');
    
    // Return user data
    res.status(200).json({
      ...user,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user data
    const user = db.prepare('SELECT id, name, bio, location, profilePicture, createdAt FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(id, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(id, 'learn');
    
    // Return user data
    res.status(200).json({
      ...user,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/me', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, location, profilePicture } = req.body;
    
    // Update user
    const stmt = db.prepare(`
      UPDATE users
      SET name = ?, bio = ?, location = ?, profilePicture = ?
      WHERE id = ?
    `);
    
    stmt.run(name, bio, location, profilePicture, userId);
    
    // Get updated user data
    const user = db.prepare('SELECT id, name, email, bio, location, profilePicture, createdAt FROM users WHERE id = ?').get(userId);
    
    // Get user skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'learn');
    
    // Return updated user data
    res.status(200).json({
      ...user,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skills Routes
app.post('/api/users/skills', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { skill, type } = req.body;
    
    if (!skill || !type || (type !== 'teach' && type !== 'learn')) {
      return res.status(400).json({ message: 'Invalid skill data' });
    }
    
    // Create skill
    const skillId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO skills (id, userId, name, category, description, experienceLevel, type, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      skillId,
      userId,
      skill.name,
      skill.category,
      skill.description || null,
      skill.experienceLevel || null,
      type,
      createdAt
    );
    
    // Get user data
    const user = db.prepare('SELECT id, name, email, bio, location, profilePicture, createdAt FROM users WHERE id = ?').get(userId);
    
    // Get updated skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'learn');
    
    // Return updated user data
    res.status(201).json({
      ...user,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/skills/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type } = req.query;
    
    if (!type || (type !== 'teach' && type !== 'learn')) {
      return res.status(400).json({ message: 'Invalid skill type' });
    }
    
    // Check if skill exists and belongs to user
    const skill = db.prepare('SELECT * FROM skills WHERE id = ? AND userId = ?').get(id, userId);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    // Delete skill
    const stmt = db.prepare('DELETE FROM skills WHERE id = ?');
    stmt.run(id);
    
    // Get user data
    const user = db.prepare('SELECT id, name, email, bio, location, profilePicture, createdAt FROM users WHERE id = ?').get(userId);
    
    // Get updated skills
    const teachSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'teach');
    const learnSkills = db.prepare('SELECT * FROM skills WHERE userId = ? AND type = ?').all(userId, 'learn');
    
    // Return updated user data
    res.status(200).json({
      ...user,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skills Directory
app.get('/api/skills', (req, res) => {
  try {
    // Get all skills with user info
    const skills = db.prepare(`
      SELECT 
        s.id, s.name, s.category, s.description, s.experienceLevel, s.type, s.createdAt,
        u.id as userId, u.name as userName, u.profilePicture as userProfilePicture
      FROM skills s
      JOIN users u ON s.userId = u.id
      ORDER BY s.createdAt DESC
    `).all();
    
    res.status(200).json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/skills/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get skill with user info
    const skill = db.prepare(`
      SELECT 
        s.id, s.name, s.category, s.description, s.experienceLevel, s.type, s.createdAt,
        u.id as userId, u.name as userName, u.profilePicture as userProfilePicture, u.bio as userBio
      FROM skills s
      JOIN users u ON s.userId = u.id
      WHERE s.id = ?
    `).get(id);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    
    res.status(200).json(skill);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Matches Routes
app.get('/api/matches', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all matches for user
    const matches = db.prepare(`
      SELECT 
        m.id, m.createdAt as matchDate,
        CASE 
          WHEN m.user1Id = ? THEN m.user2Id
          ELSE m.user1Id
        END as userId,
        u.name as userName,
        u.profilePicture as userProfilePicture
      FROM matches m
      JOIN users u ON (m.user1Id = ? AND u.id = m.user2Id) OR (m.user2Id = ? AND u.id = m.user1Id)
      ORDER BY m.createdAt DESC
    `).all(userId, userId, userId);
    
    // Get skills for each match
    const matchesWithSkills = matches.map(match => {
      const teachSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'teach'
      `).all(match.userId).map(skill => skill.name);
      
      const learnSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'learn'
      `).all(match.userId).map(skill => skill.name);
      
      // Get last message date
      const lastMessage = db.prepare(`
        SELECT timestamp FROM messages
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
        ORDER BY timestamp DESC
        LIMIT 1
      `).get(userId, match.userId, match.userId, userId);
      
      return {
        ...match,
        teachSkills,
        learnSkills,
        lastMessageDate: lastMessage ? lastMessage.timestamp : null
      };
    });
    
    res.status(200).json(matchesWithSkills);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/matches/requests/incoming', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get incoming requests
    const requests = db.prepare(`
      SELECT 
        r.id, r.message, r.createdAt,
        u.id as senderId, u.name as senderName, u.profilePicture as senderProfilePicture
      FROM swap_requests r
      JOIN users u ON r.senderId = u.id
      WHERE r.recipientId = ? AND r.status = 'pending'
      ORDER BY r.createdAt DESC
    `).all(userId);
    
    // Get skills for each sender
    const requestsWithSkills = requests.map(request => {
      const teachSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'teach'
      `).all(request.senderId).map(skill => skill.name);
      
      const learnSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'learn'
      `).all(request.senderId).map(skill => skill.name);
      
      return {
        ...request,
        teachSkills,
        learnSkills
      };
    });
    
    res.status(200).json(requestsWithSkills);
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/matches/requests/outgoing', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get outgoing requests
    const requests = db.prepare(`
      SELECT 
        r.id, r.message, r.createdAt,
        u.id as recipientId, u.name as recipientName, u.profilePicture as recipientProfilePicture
      FROM swap_requests r
      JOIN users u ON r.recipientId = u.id
      WHERE r.senderId = ? AND r.status = 'pending'
      ORDER BY r.createdAt DESC
    `).all(userId);
    
    // Get skills for each recipient
    const requestsWithSkills = requests.map(request => {
      const teachSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'teach'
      `).all(request.recipientId).map(skill => skill.name);
      
      const learnSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'learn'
      `).all(request.recipientId).map(skill => skill.name);
      
      return {
        ...request,
        teachSkills,
        learnSkills
      };
    });
    
    res.status(200).json(requestsWithSkills);
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/matches/potential', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's teach and learn skills
    const userTeachSkills = db.prepare(`
      SELECT category FROM skills 
      WHERE userId = ? AND type = 'teach'
    `).all(userId);
    
    const userLearnSkills = db.prepare(`
      SELECT category FROM skills 
      WHERE userId = ? AND type = 'learn'
    `).all(userId);
    
    if (userTeachSkills.length === 0 || userLearnSkills.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get potential matches (users who teach what I want to learn and learn what I can teach)
    const teachCategories = userTeachSkills.map(skill => skill.category);
    const learnCategories = userLearnSkills.map(skill => skill.category);
    
    // Find users who teach what I want to learn
    const potentialTeachers = db.prepare(`
      SELECT DISTINCT userId 
      FROM skills 
      WHERE type = 'teach' AND category IN (${learnCategories.map(() => '?').join(',')})
      AND userId != ?
    `).all(...learnCategories, userId);
    
    // Find users who want to learn what I can teach
    const potentialLearners = db.prepare(`
      SELECT DISTINCT userId 
      FROM skills 
      WHERE type = 'learn' AND category IN (${teachCategories.map(() => '?').join(',')})
      AND userId != ?
    `).all(...teachCategories, userId);
    
    // Find intersection (users who both teach what I want to learn and learn what I can teach)
    const potentialMatchIds = potentialTeachers
      .filter(teacher => potentialLearners.some(learner => learner.userId === teacher.userId))
      .map(match => match.userId);
    
    if (potentialMatchIds.length === 0) {
      return res.status(200).json([]);
    }
    
    // Exclude users who already have a match or pending request
    const existingConnections = db.prepare(`
      SELECT DISTINCT
        CASE 
          WHEN user1Id = ? THEN user2Id
          ELSE user1Id
        END as userId
      FROM matches
      WHERE user1Id = ? OR user2Id = ?
      
      UNION
      
      SELECT senderId as userId
      FROM swap_requests
      WHERE recipientId = ? AND status = 'pending'
      
      UNION
      
      SELECT recipientId as userId
      FROM swap_requests
      WHERE senderId = ? AND status = 'pending'
    `).all(userId, userId, userId, userId, userId);
    
    const existingConnectionIds = existingConnections.map(conn => conn.userId);
    
    const filteredMatchIds = potentialMatchIds.filter(id => !existingConnectionIds.includes(id));
    
    if (filteredMatchIds.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get user details for potential matches
    const potentialMatches = filteredMatchIds.map(matchId => {
      const user = db.prepare(`
        SELECT id, name, profilePicture
      `).get(matchId);
      
      const teachSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'teach'
      `).all(matchId).map(skill => skill.name);
      
      const learnSkills = db.prepare(`
        SELECT name FROM skills 
        WHERE userId = ? AND type = 'learn'
      `).all(matchId).map(skill => skill.name);
      
      return {
        id: user.id,
        userId: user.id,
        userName: user.name,
        userProfilePicture: user.profilePicture,
        teachSkills,
        learnSkills
      };
    });
    
    res.status(200).json(potentialMatches);
  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/matches/status/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    // Check if already matched
    const match = db.prepare(`
      SELECT id FROM matches
      WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)
    `).get(currentUserId, userId, userId, currentUserId);
    
    if (match) {
      return res.status(200).json({
        isMatched: true,
        isPending: false,
        requestSent: false,
        requestReceived: false,
        matchId: match.id
      });
    }
    
    // Check for pending requests
    const sentRequest = db.prepare(`
      SELECT id FROM swap_requests
      WHERE senderId = ? AND recipientId = ? AND status = 'pending'
    `).get(currentUserId, userId);
    
    if (sentRequest) {
      return res.status(200).json({
        isMatched: false,
        isPending: true,
        requestSent: true,
        requestReceived: false,
        requestId: sentRequest.id
      });
    }
    
    const receivedRequest = db.prepare(`
      SELECT id FROM swap_requests
      WHERE senderId = ? AND recipientId = ? AND status = 'pending'
    `).get(userId, currentUserId);
    
    if (receivedRequest) {
      return res.status(200).json({
        isMatched: false,
        isPending: true,
        requestSent: false,
        requestReceived: true,
        requestId: receivedRequest.id
      });
    }
    
    // No relationship
    return res.status(200).json({
      isMatched: false,
      isPending: false,
      requestSent: false,
      requestReceived: false
    });
  } catch (error) {
    console.error('Get match status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/matches/request', authenticateToken, (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, message } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Check if users are already matched
    const existingMatch = db.prepare(`
      SELECT id FROM matches
      WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)
    `).get(senderId, recipientId, recipientId, senderId);
    
    if (existingMatch) {
      return res.status(400).json({ message: 'Users are already matched' });
    }
    
    // Check if there's already a pending request
    const existingRequest = db.prepare(`
      SELECT id FROM swap_requests
      WHERE 
        (senderId = ? AND recipientId = ? AND status = 'pending') OR
        (senderId = ? AND recipientId = ? AND status = 'pending')
    `).get(senderId, recipientId, recipientId, senderId);
    
    if (existingRequest) {
      return res.status(400).json({ message: 'A request already exists between these users' });
    }
    
    // Create request
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO swap_requests (id, senderId, recipientId, message, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(requestId, senderId, recipientId, message || null, 'pending', createdAt);
    
    res.status(201).json({ id: requestId, status: 'pending' });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/matches/accept/:requestId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    
    // Get request
    const request = db.prepare(`
      SELECT * FROM swap_requests
      WHERE id = ? AND recipientId = ? AND status = 'pending'
    `).get(requestId, userId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found or not authorized' });
    }
    
    // Update request status
    db.prepare(`
      UPDATE swap_requests
      SET status = 'accepted'
      WHERE id = ?
    `).run(requestId);
    
    // Create match
    const matchId = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO matches (id, user1Id, user2Id, requestId, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(matchId, request.senderId, request.recipientId, requestId, createdAt);
    
    res.status(200).json({ id: matchId, status: 'matched' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/matches/decline/:requestId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    
    // Get request
    const request = db.prepare(`
      SELECT * FROM swap_requests
      WHERE id = ? AND recipientId = ? AND status = 'pending'
    `).get(requestId, userId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found or not authorized' });
    }
    
    // Update request status
    db.prepare(`
      UPDATE swap_requests
      SET status = 'declined'
      WHERE id = ?
    `).run(requestId);
    
    res.status(200).json({ id: requestId, status: 'declined' });
  } catch (error) {
    console.error('Decline request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/matches/requests/:requestId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    
    // Get request
    const request = db.prepare(`
      SELECT * FROM swap_requests
      WHERE id = ? AND senderId = ? AND status = 'pending'
    `).get(requestId, userId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found or not authorized' });
    }
    
    // Delete request
    db.prepare(`
      DELETE FROM swap_requests
      WHERE id = ?
    `).run(requestId);
    
    res.status(200).json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Messages Routes
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    // Get messages between users
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE 
        (senderId = ? AND receiverId = ?) OR
        (senderId = ? AND receiverId = ?)
      ORDER BY timestamp ASC
    `).all(currentUserId, userId, userId, currentUserId);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/messages/read/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    // Mark messages as read
    db.prepare(`
      UPDATE messages
      SET read = 1
      WHERE senderId = ? AND receiverId = ? AND read = 0
    `).run(userId, currentUserId);
    
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ratings Routes
app.post('/api/ratings', authenticateToken, (req, res) => {
  try {
    const raterId = req.user.id;
    const { userId, rating, comment } = req.body;
    
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating data' });
    }
    
    // Check if users are matched
    const match = db.prepare(`
      SELECT id FROM matches
      WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)
    `).get(raterId, userId, userId, raterId);
    
    if (!match) {
      return res.status(400).json({ message: 'You can only rate users you are matched with' });
    }
    
    // Check if already rated
    const existingRating = db.prepare(`
      SELECT id FROM ratings
      WHERE raterId = ? AND ratedUserId = ?
    `).get(raterId, userId);
    
    if (existingRating) {
      // Update existing rating
      db.prepare(`
        UPDATE ratings
        SET rating = ?, comment = ?, createdAt = ?
        WHERE id = ?
      `).run(rating, comment || null, new Date().toISOString(), existingRating.id);
      
      return res.status(200).json({ id: existingRating.id, message: 'Rating updated' });
    }
    
    // Create new rating
    const ratingId = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO ratings (id, raterId, ratedUserId, rating, comment, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ratingId, raterId, userId, rating, comment || null, createdAt);
    
    res.status(201).json({ id: ratingId, message: 'Rating submitted' });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});