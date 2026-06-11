import express from 'express';
import User from '../models/User.js';
import { auth, requireNCAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all members across all LCs (NC Admin only)
router.get('/', auth, requireNCAdmin, async (req, res) => {
  try {
    const { lc, search } = req.query;
    let query = { role: 'MEMBER' };

    if (lc) {
      query.lc = lc;
    }

    if (search) {
      const normalizedSearch = search.trim();
      query.$or = [
        { name: new RegExp(normalizedSearch, 'i') },
        { email: new RegExp(normalizedSearch, 'i') },
        { learnId: new RegExp(normalizedSearch, 'i') }
      ];
    }

    const members = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ message: 'Server error while fetching members' });
  }
});

// Bulk Upload Members via CSV (NC Admin only)
router.post('/bulk-upload', auth, requireNCAdmin, async (req, res) => {
  try {
    const { members, defaultLc } = req.body;

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Invalid bulk data format' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const member of members) {
      const { learnId, email, name, yearsLeftForMembership, lc } = member;

      if (!email || !name) {
        results.errors.push({ email: email || 'N/A', reason: 'Missing email or name' });
        continue;
      }

      // Determine LC
      const finalLc = (lc || defaultLc || '').trim().toUpperCase();
      if (!['MU', 'MUJ', 'KU', 'JECRC'].includes(finalLc)) {
        results.errors.push({ email, reason: `Invalid Local Committee (LC): ${finalLc || 'None'}` });
        continue;
      }

      // Check duplicates
      const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
      if (emailExists) {
        results.errors.push({ email, reason: 'Email already exists' });
        continue;
      }

      if (learnId) {
        const learnIdExists = await User.findOne({ learnId: learnId.trim() });
        if (learnIdExists) {
          results.errors.push({ email, reason: `Learn ID '${learnId}' already exists` });
          continue;
        }
      }

      // Generate temp password
      const tempPass = `IAESTE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Hash temp password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPass, salt);

      // Create new user
      const newUser = new User({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'MEMBER',
        lc: finalLc,
        learnId: learnId ? learnId.trim() : undefined,
        yearsLeftForMembership: Number(yearsLeftForMembership) || 0,
        isTempPassword: true,
        tempPassword: tempPass // Save raw temp password for reference/prompt logic
      });

      // Populate initial resume structure
      newUser.resume = {
        personalInfo: {
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phone: '',
          college: `LC ${finalLc} Partner College`,
          lc: finalLc,
          bio: ''
        },
        education: [],
        experience: [],
        projects: [],
        skills: [],
        languages: [],
        certifications: [],
        isCompleted: false
      };

      await newUser.save();

      // Simulate sending email to console log
      console.log('\n================================================================');
      console.log(`[SIMULATED MAIL SERVER]`);
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to IAESTE India Portal — Temp Password`);
      console.log(`Body:`);
      console.log(`  Dear ${name},`);
      console.log(`  An account has been created for you in the IAESTE India Portal.`);
      console.log(`  Please use the details below to log in and set up your profile:`);
      console.log(`  `);
      console.log(`  Learn ID:      ${learnId || 'N/A'}`);
      console.log(`  Email ID:      ${email}`);
      console.log(`  Temp Password: ${tempPass}`);
      console.log(`  `);
      console.log(`  Visit: http://localhost:5173/login to sign in and set your new password.`);
      console.log('================================================================\n');

      results.success.push({
        learnId,
        email,
        name,
        lc: finalLc,
        tempPassword: tempPass
      });
    }

    res.json({
      message: `Bulk upload completed. Created ${results.success.length} accounts, encountered ${results.errors.length} errors.`,
      success: results.success,
      errors: results.errors
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Server error during bulk account creation' });
  }
});

// Update member details (NC Admin only)
router.put('/:id', auth, requireNCAdmin, async (req, res) => {
  try {
    const { name, email, lc } = req.body;
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.role !== 'MEMBER') {
      return res.status(400).json({ message: 'Only accounts with role MEMBER can be edited here' });
    }

    if (name) member.name = name;
    if (email) member.email = email.trim().toLowerCase();
    if (lc) {
      if (!['MU', 'MUJ', 'KU', 'JECRC'].includes(lc)) {
        return res.status(400).json({ message: 'Invalid LC' });
      }
      member.lc = lc;
      if (member.resume && member.resume.personalInfo) {
        member.resume.personalInfo.lc = lc;
      }
    }

    await member.save();
    res.json({ message: 'Member updated successfully', member });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error while updating member' });
  }
});

// Delete a member (NC Admin only)
router.delete('/:id', auth, requireNCAdmin, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.role !== 'MEMBER') {
      return res.status(400).json({ message: 'Only accounts with role MEMBER can be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Server error while deleting member' });
  }
});

export default router;
