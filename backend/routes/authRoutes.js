import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'iaeste_secret_key_2026';

const normalizeEmail = (email) => email.trim().toLowerCase();
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  lc: user.lc,
  learnId: user.learnId || null,
  yearsLeftForMembership: user.yearsLeftForMembership ?? 0,
  isTempPassword: user.isTempPassword,
  resume: user.resume
});

// Register a new Member
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, lc } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!name || !email || !password || !lc) {
      return res.status(400).json({ message: 'All fields (name, email, password, lc) are required' });
    }

    if (!['MU', 'MUJ', 'KU', 'JECRC'].includes(lc)) {
      return res.status(400).json({ message: 'Invalid Local Committee (LC) specified' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create member
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'MEMBER',
      lc,
      resume: {
        personalInfo: {
          fullName: name,
          email: email,
          phone: '',
          college: `LC ${lc} Partner College`,
          lc: lc,
          bio: ''
        },
        education: [],
        experience: [],
        projects: [],
        skills: [],
        languages: [],
        certifications: [],
        isCompleted: false
      }
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, lc: newUser.lc, name: newUser.name, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: buildUserResponse(newUser)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, lc: user.lc, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile (including resume)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(buildUserResponse(user));
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update Member's resume
router.put('/resume', auth, async (req, res) => {
  try {
    const { personalInfo, education, experience, projects, skills, languages, certifications } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'MEMBER') {
      return res.status(400).json({ message: 'Only members can edit their resumes' });
    }

    user.resume = {
      personalInfo: {
        fullName: personalInfo?.fullName || user.name,
        email: personalInfo?.email || user.email,
        phone: personalInfo?.phone || '',
        college: personalInfo?.college || '',
        lc: user.lc,
        bio: personalInfo?.bio || ''
      },
      education: education || [],
      experience: experience || [],
      projects: projects || [],
      skills: skills || [],
      languages: languages || [],
      certifications: certifications || [],
      isCompleted: true
    };

    await user.save();
    res.json({ message: 'Resume updated successfully', resume: user.resume });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ message: 'Server error while updating resume' });
  }
});

// Reset temporary password
router.put('/reset-temp-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.isTempPassword = false;
    user.tempPassword = null;

    await user.save();
    res.json({ message: 'Password reset successfully. Account is fully activated.' });
  } catch (error) {
    console.error('Reset temp password error:', error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

export default router;
