import express from 'express';
import Application from '../models/Application.js';
import Offer from '../models/Offer.js';
import User from '../models/User.js';
import { auth, requireMember, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply to an offer (Member only)
router.post('/', auth, requireMember, async (req, res) => {
  try {
    const { offerId } = req.body;
    const memberId = req.user.id;
    const memberLc = req.user.lc;

    if (!offerId) {
      return res.status(400).json({ message: 'Offer ID is required' });
    }

    // 1. Fetch user and verify resume is completed
    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resume || !user.resume.isCompleted) {
      return res.status(400).json({
        message: 'Your resume profile is incomplete. Please fill out your resume details before applying.'
      });
    }

    // 2. Fetch offer and verify it is released in member's LC
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (!offer.releasedLcs.includes(memberLc)) {
      return res.status(403).json({
        message: 'This offer is not currently active or released in your Local Committee (LC).'
      });
    }

    // 3. Check if user already applied
    const existingApp = await Application.findOne({ offerId, memberId });
    if (existingApp) {
      return res.status(400).json({ message: 'You have already applied to this offer.' });
    }

    // 4. Create application with resume snapshot
    const application = new Application({
      offerId,
      memberId,
      resumeSnapshot: {
        personalInfo: user.resume.personalInfo,
        education: user.resume.education,
        experience: user.resume.experience,
        projects: user.resume.projects,
        skills: user.resume.skills,
        languages: user.resume.languages,
        certifications: user.resume.certifications
      },
      status: 'APPLIED'
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (error) {
    console.error('Submit application error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this offer.' });
    }
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Get member's own applications (Member only)
router.get('/my', auth, requireMember, async (req, res) => {
  try {
    const applications = await Application.find({ memberId: req.user.id })
      .populate('offerId')
      .sort({ appliedAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Fetch my applications error:', error);
    res.status(500).json({ message: 'Server error while fetching your applications' });
  }
});

// Get all applications for a specific offer (Admins only)
router.get('/offer/:offerId', auth, requireAdmin, async (req, res) => {
  try {
    const { role, lc } = req.user;
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // If LC Admin, check if the offer belongs to their LC or is global and released by them
    if (role === 'LC_ADMIN') {
      if (offer.lcScope === 'SPECIFIC' && offer.targetLc !== lc) {
        return res.status(403).json({ message: 'Unauthorized: Offer does not belong to your LC' });
      }
    }

    // Fetch applications, populate member name and email
    const applications = await Application.find({ offerId })
      .populate('memberId', 'name email lc')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Fetch offer applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Get all applications (NC Admin sees all, LC Admin sees applications for their LC's offers)
router.get('/all', auth, requireAdmin, async (req, res) => {
  try {
    const { role, lc } = req.user;

    let query = {};
    if (role === 'LC_ADMIN') {
      // Find offers belonging to or released by this LC
      const offers = await Offer.find({
        $or: [
          { targetLc: lc },
          { releasedLcs: lc }
        ]
      }).select('_id');
      const offerIds = offers.map(o => o._id);
      query = { offerId: { $in: offerIds } };
    }

    const applications = await Application.find(query)
      .populate('offerId')
      .populate('memberId', 'name email lc')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Fetch all applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Update application status (Admins only)
router.put('/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { role, lc } = req.user;

    if (!['REVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified' });
    }

    const application = await Application.findById(req.params.id).populate('offerId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization check for LC Admin
    if (role === 'LC_ADMIN') {
      const offer = application.offerId;
      if (offer.lcScope === 'SPECIFIC' && offer.targetLc !== lc) {
        return res.status(403).json({ message: 'Unauthorized to review applications for other LCs' });
      }
      // If it's a global offer, ensure the student belongs to this LC Admin's LC
      const student = await User.findById(application.memberId);
      if (student && student.lc !== lc) {
        return res.status(403).json({ message: 'Unauthorized to review applications of students from other LCs' });
      }
    }

    application.status = status;
    await application.save();

    res.json({ message: `Application status updated to ${status}`, application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

export default router;
