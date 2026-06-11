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

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_HOSTS = [
  'ac-xmfpnvb-shard-00-00.lzucdxf.mongodb.net',
  'ac-xmfpnvb-shard-00-01.lzucdxf.mongodb.net',
  'ac-xmfpnvb-shard-00-02.lzucdxf.mongodb.net'
];
const MONGODB_REPLICA_SET = 'atlas-rp5p7t-shard-0';

const buildDirectMongoUri = (password) => {
  return `mongodb://Mitul:${encodeURIComponent(password)}@${MONGODB_HOSTS.join(',')}/iaeste_india?authSource=admin&replicaSet=${MONGODB_REPLICA_SET}&retryWrites=true&w=majority&tls=true`;
};

const buildMongoUri = () => {
  const password = process.env.MONGODB_PASSWORD?.trim();
  if (password) {
    return {
      primary: `mongodb+srv://Mitul:${encodeURIComponent(password)}@cluster.lzucdxf.mongodb.net/iaeste_india?retryWrites=true&w=majority&appName=Cluster`,
      fallback: buildDirectMongoUri(password)
    };
  }

  const explicitUri = process.env.MONGODB_URI?.trim();
  if (explicitUri) {
    return { primary: explicitUri, fallback: null };
  }

  return { primary: 'mongodb://127.0.0.1:27017/iaeste_india', fallback: null };
};

const { primary: MONGODB_URI, fallback: FALLBACK_MONGODB_URI } = buildMongoUri();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const app = express();

// Middlewares
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/applications', applicationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'IAESTE India Backend Server is healthy' });
});

// Database seeding function for Admins
const seedAdmins = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('admin123', salt);

    // 1. Seed NC Admin
    const ncAdminExists = await User.findOne({ role: 'NC_ADMIN' });
    if (!ncAdminExists) {
      const ncAdmin = new User({
        name: 'National Committee Admin',
        email: 'ncadmin@iaeste.in',
        password: defaultPasswordHash,
        role: 'NC_ADMIN',
        lc: 'GLOBAL'
      });
      await ncAdmin.save();
      console.log('Seeded NC Admin: ncadmin@iaeste.in / admin123');
    }

    // 2. Seed LC Admins
    const lcs = ['MU', 'MUJ', 'KU', 'JECRC'];
    for (const lc of lcs) {
      const email = `${lc.toLowerCase()}admin@iaeste.in`;
      const lcAdminExists = await User.findOne({ email });
      if (!lcAdminExists) {
        const lcAdmin = new User({
          name: `LC ${lc} Admin`,
          email,
          password: defaultPasswordHash,
          role: 'LC_ADMIN',
          lc
        });
        await lcAdmin.save();
        console.log(`Seeded LC Admin for ${lc}: ${email} / admin123`);
      }
    }
  } catch (error) {
    console.error('Error seeding admin users:', error);
  }
};

// Connect to Database & Start Server
if (process.env.SKIP_DB_CONNECT === 'true') {
  console.log('Skipping MongoDB connection because SKIP_DB_CONNECT=true.');
} else {
  const connect = async () => {
    try {
      await mongoose.connect(MONGODB_URI);
    } catch (err) {
      const shouldFallback = FALLBACK_MONGODB_URI && String(err?.message || err).includes('querySrv');

      if (!shouldFallback) {
        throw err;
      }

      console.warn('Primary MongoDB SRV lookup failed. Retrying with direct hosts.');
      await mongoose.connect(FALLBACK_MONGODB_URI);
    }
  };

  connect()
    .then(async () => {
      console.log('Connected to MongoDB database successfully.');
      await seedAdmins();
      app.listen(PORT, () => {
        console.log(`Backend server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB database connection error:', err);
      process.exit(1);
    });
}
