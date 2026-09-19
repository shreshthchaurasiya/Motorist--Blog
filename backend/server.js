const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Admin Setup Route (One-time use to create first admin)
app.post('/api/setup-admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingAdmin = await prisma.admin.findUnique({ where: { username } });
    if (existingAdmin) return res.status(400).json({ error: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { username, passwordHash },
    });
    res.json({ message: 'Admin created successfully', adminId: admin.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware for auth
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    req.adminId = decoded.adminId;

    // Auto-resurrect admin if db was reset (prevents ghost logins)
    const adminExists = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (!adminExists) {
      await prisma.admin.create({
        data: {
          id: req.adminId,
          username: 'admin',
          displayName: 'Admin',
          passwordHash: await bcrypt.hash('admin123', 10)
        }
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current admin
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId },
      select: { id: true, username: true, displayName: true, profilePicture: true }
    });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile picture
app.post('/api/profile-picture', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    const profilePictureUrl = `/uploads/${req.file.filename}`;
    
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { profilePicture: profilePictureUrl }
    });
    
    res.json({ message: 'Profile picture updated', profilePicture: profilePictureUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update display name
app.put('/api/profile-name', authMiddleware, async (req, res) => {
  try {
    const { displayName } = req.body;
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { displayName }
    });
    res.json({ message: 'Display name updated', displayName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog Routes
app.get('/api/blogs', async (req, res) => {
  const blogs = await prisma.blog.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: { 
      admin: { select: { username: true, displayName: true, profilePicture: true } },
      likes: { select: { userId: true } },
      comments: { 
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  res.json(blogs);
});

app.post('/api/blogs', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const blog = await prisma.blog.create({
      data: { 
        title, 
        content, 
        imageUrl,
        adminId: req.adminId
      },
    });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Public User Routes ---

// Public User Registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { phoneNumber, name, password } = req.body;
    if (!phoneNumber || !name || !password) return res.status(400).json({ error: 'Phone, Name, and Password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingUser) return res.status(400).json({ error: 'Phone number already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { phoneNumber, name, passwordHash } });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, phoneNumber: user.phoneNumber } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public User Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) return res.status(400).json({ error: 'Phone and Password are required' });

    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, phoneNumber: user.phoneNumber } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Middleware
const publicAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized user' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid user token' });
  }
};

// Toggle Like
app.post('/api/blogs/:id/like', publicAuthMiddleware, async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.userId;

    const existingLike = await prisma.like.findUnique({
      where: { blogId_userId: { blogId, userId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { blogId, userId } });
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Comment
app.post('/api/blogs/:id/comment', publicAuthMiddleware, async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });

    const comment = await prisma.comment.create({
      data: { text, blogId, userId },
      include: { user: { select: { name: true } } }
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Reply to Comment
app.put('/api/comments/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;
    
    // Ensure the comment belongs to a blog owned by this admin
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { blog: true }
    });
    
    if (!comment || comment.blog.adminId !== req.adminId) {
      return res.status(403).json({ error: 'Unauthorized to reply to this comment' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { adminReply },
      include: { user: { select: { name: true } }, blog: { select: { title: true } } }
    });
    
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Notifications (Recent comments)
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { blog: { adminId: req.adminId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true } },
        blog: { select: { title: true } }
      }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
