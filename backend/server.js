import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// =========================
// ENV CHECK (IMPORTANT)
// =========================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in environment variables");
  process.exit(1);
}

// =========================
// CORS CONFIG
// =========================
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

const app = express();

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =========================
// ROUTES
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'IAESTE India Backend Server is running'
  });
});

// =========================
// SEED ADMIN USERS
// =========================
const seedAdmins = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('admin123', salt);

    // NC Admin
    const ncAdminExists = await User.findOne({ role: 'NC_ADMIN' });
    if (!ncAdminExists) {
      await User.create({
        name: 'National Committee Admin',
        email: 'ncadmin@iaeste.in',
        password: defaultPasswordHash,
        role: 'NC_ADMIN',
        lc: 'GLOBAL'
      });
      console.log('Seeded NC Admin');
    }

    // LC Admins
    const lcs = ['MU', 'MUJ', 'KU', 'JECRC'];

    for (const lc of lcs) {
      const email = `${lc.toLowerCase()}admin@iaeste.in`;

      const exists = await User.findOne({ email });
      if (!exists) {
        await User.create({
          name: `LC ${lc} Admin`,
          email,
          password: defaultPasswordHash,
          role: 'LC_ADMIN',
          lc
        });
        console.log(`Seeded LC Admin: ${lc}`);
      }
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
};

// =========================
// DB CONNECT + START SERVER
// =========================
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await seedAdmins();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

startServer();