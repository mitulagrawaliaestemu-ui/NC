import express from 'express';
import Application from '../models/Application.js';
import Offer from '../models/Offer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { auth, requireMember, requireAdmin, requireNCAdmin } from '../middleware/auth.js';

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

    // Check if offer is active and released in member's LC
    if (!offer.releasedLcs.includes(memberLc)) {
      return res.status(403).json({
        message: 'This offer is not currently active or released in your Local Committee (LC).'
      });
    }

    // Check if the deadline has passed
    if (offer.deadline && new Date(offer.deadline) < new Date()) {
      return res.status(400).json({
        message: 'The application deadline for this offer has passed.'
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

    // Create Audit Log
    const auditLog = new AuditLog({
      action: 'CANDIDATE_APPLICATION',
      performedBy: memberId,
      targetId: application._id,
      details: `Candidate '${user.name}' applied to offer '${offer.title}' (${offer.offerCode})`
    });
    await auditLog.save();

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

// Get audit logs (NC Admin only)
router.get('/audit-logs', auth, requireNCAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role lc')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ message: 'Server error while fetching audit logs' });
  }
});

// Get analytics stats for NC Admin Dashboard
router.get('/stats', auth, requireNCAdmin, async (req, res) => {
  try {
    const totalOffers = await Offer.countDocuments();
    const activeOffers = await Offer.countDocuments({ status: 'RELEASED', deadline: { $gt: new Date() } });
    const closedOffers = await Offer.countDocuments({
      $or: [
        { status: 'CLOSED' },
        { deadline: { $lte: new Date() } }
      ]
    });
    const globalOffers = await Offer.countDocuments({ lcScope: 'GLOBAL' });
    const lcSpecificOffers = await Offer.countDocuments({ lcScope: 'SPECIFIC' });
    const totalApplications = await Application.countDocuments();
    const totalNominations = await Application.countDocuments({ status: { $in: ['NOMINATED', 'SELECTED'] } });

    // LC performance tracking
    const lcs = ['MU', 'MUJ', 'KU', 'JECRC'];
    const lcPerformance = [];

    // Grouping for charts
    const applicationsByLc = [];
    const offersByLc = [];

    for (const lcCode of lcs) {
      // Find how many offers were received/targeted or global released in this LC
      const offersReceived = await Offer.countDocuments({
        $or: [
          { targetLc: lcCode },
          { lcScope: 'GLOBAL', releasedLcs: lcCode }
        ]
      });

      // Find candidates of this LC
      const lcUsers = await User.find({ lc: lcCode }).select('_id');
      const lcUserIds = lcUsers.map(u => u._id);

      // Find applications from this LC's candidates
      const applicationsCount = await Application.countDocuments({ memberId: { $in: lcUserIds } });
      applicationsByLc.push({ lc: lcCode, count: applicationsCount });
      offersByLc.push({ lc: lcCode, count: offersReceived });

      // Find nominations/selections from this LC
      const nominationsCount = await Application.countDocuments({
        memberId: { $in: lcUserIds },
        status: { $in: ['NOMINATED', 'SELECTED'] }
      });

      // Calculate success rate
      const successRate = applicationsCount > 0 ? Math.round((nominationsCount / applicationsCount) * 100) : 0;

      // Find last activity
      const lastApp = await Application.findOne({ memberId: { $in: lcUserIds } })
        .sort({ appliedAt: -1 })
        .select('appliedAt');
      const lastActivity = lastApp ? lastApp.appliedAt : null;

      lcPerformance.push({
        lcName: `LC ${lcCode}`,
        lcCode,
        offersReceived,
        applicationsCount,
        nominationsCount,
        successRate,
        lastActivity
      });
    }

    // Monthly trends (past 6 months)
    const monthlyTrends = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const matchStage = {
      $match: {
        appliedAt: { $gte: sixMonthsAgo }
      }
    };

    const groupStage = {
      $group: {
        _id: {
          year: { $year: '$appliedAt' },
          month: { $month: '$appliedAt' }
        },
        count: { $sum: 1 }
      }
    };

    const sortStage = {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    };

    const trendsData = await Application.aggregate([matchStage, groupStage, sortStage]);

    // Format monthly trends for easy charting
    trendsData.forEach(item => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      monthlyTrends.push({ month: label, count: item.count });
    });

    res.json({
      totalOffers,
      activeOffers,
      closedOffers,
      globalOffers,
      lcSpecificOffers,
      totalApplications,
      totalNominations,
      lcPerformance,
      charts: {
        applicationsByLc,
        offersByLc,
        monthlyTrends,
        offerTypeDistribution: [
          { name: 'Global Offers', value: globalOffers },
          { name: 'LC Specific Offers', value: lcSpecificOffers }
        ]
      }
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while calculating stats' });
  }
});

// Get analytics stats for LC Admin Dashboard
router.get('/lc-stats', auth, requireAdmin, async (req, res) => {
  try {
    const { lc } = req.user;

    const activeOffers = await Offer.countDocuments({
      $or: [
        { targetLc: lc },
        { lcScope: 'GLOBAL', releasedLcs: lc }
      ],
      status: 'RELEASED',
      deadline: { $gt: new Date() }
    });

    const closedOffers = await Offer.countDocuments({
      $or: [
        { targetLc: lc },
        { lcScope: 'GLOBAL', releasedLcs: lc }
      ],
      $or: [
        { status: 'CLOSED' },
        { deadline: { $lte: new Date() } }
      ]
    });

    // Find candidates of this LC
    const lcUsers = await User.find({ lc }).select('_id');
    const lcUserIds = lcUsers.map(u => u._id);

    const applicationsReceived = await Application.countDocuments({ memberId: { $in: lcUserIds } });
    const candidatesNominated = await Application.countDocuments({
      memberId: { $in: lcUserIds },
      status: { $in: ['NOMINATED', 'SELECTED'] }
    });

    res.json({
      activeOffers,
      applicationsReceived,
      candidatesNominated,
      closedOffers
    });
  } catch (error) {
    console.error('Fetch LC dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while calculating LC stats' });
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

    let applicationQuery = { offerId };

    // Authorization & scoping check for LC Admin
    if (role === 'LC_ADMIN') {
      if (offer.lcScope === 'SPECIFIC') {
        if (offer.targetLc !== lc) {
          return res.status(403).json({ message: 'Unauthorized: Offer does not belong to your LC' });
        }
      } else if (offer.lcScope === 'GLOBAL') {
        // LC Admin can only see applications from candidates belonging to their LC
        const usersInLc = await User.find({ lc }).select('_id');
        const userIds = usersInLc.map(u => u._id);
        applicationQuery.memberId = { $in: userIds };
      }
    }

    // Fetch applications, populate member name, email, lc
    const applications = await Application.find(applicationQuery)
      .populate('memberId', 'name email lc')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Fetch offer applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Get all applications (NC Admin sees all, LC Admin sees applications for their LC's candidates)
router.get('/all', auth, requireAdmin, async (req, res) => {
  try {
    const { role, lc } = req.user;

    let query = {};
    if (role === 'LC_ADMIN') {
      // Find candidates belonging to this LC Admin's LC
      const usersInLc = await User.find({ lc }).select('_id');
      const userIds = usersInLc.map(u => u._id);
      query = { memberId: { $in: userIds } };
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

// Update application status / Select Nominee or Winner (Admins only)
router.put('/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { role, lc, id: userId } = req.user;

    if (!['APPLIED', 'REVIEWING', 'NOMINATED', 'SELECTED', 'NOT_SELECTED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified' });
    }

    const application = await Application.findById(req.params.id)
      .populate('offerId')
      .populate('memberId', 'name email lc');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const offer = application.offerId;
    const applicant = application.memberId;

    // Authorization check for LC Admin
    if (role === 'LC_ADMIN') {
      if (offer.lcScope === 'SPECIFIC' && offer.targetLc !== lc) {
        return res.status(403).json({ message: 'Unauthorized to review applications for other LCs' });
      }
      if (applicant.lc !== lc) {
        return res.status(403).json({ message: 'Unauthorized to review candidates from other LCs' });
      }
    }

    // Business Logic: Nominate (for Global Offer) or Select Winner (for LC Specific Offer)
    if (status === 'NOMINATED') {
      if (offer.lcScope !== 'GLOBAL') {
        return res.status(400).json({ message: 'Nomination is only valid for Global Offers.' });
      }

      if (role !== 'LC_ADMIN') {
        return res.status(400).json({ message: 'Only LC Admins can nominate candidates.' });
      }

      // Check if this LC has already nominated someone for this offer
      const usersInLc = await User.find({ lc }).select('_id');
      const userIds = usersInLc.map(u => u._id);
      
      const existingNomination = await Application.findOne({
        offerId: offer._id,
        memberId: { $in: userIds },
        status: 'NOMINATED'
      });

      if (existingNomination && existingNomination._id.toString() !== application._id.toString()) {
        return res.status(400).json({
          message: `Your LC (${lc}) has already nominated candidate '${existingNomination.resumeSnapshot?.personalInfo?.fullName || 'another student'}' for this Global Offer.`
        });
      }

      application.status = 'NOMINATED';
      await application.save();

      // Log the nomination
      const auditLog = new AuditLog({
        action: 'NOMINATION_SELECTION',
        performedBy: userId,
        targetId: application._id,
        details: `LC Admin (${lc}) nominated Candidate '${applicant.name}' for Global Offer '${offer.title}'`
      });
      await auditLog.save();

    } else if (status === 'SELECTED') {
      // If Specific Offer, selected by LC Admin
      if (offer.lcScope === 'SPECIFIC') {
        if (role !== 'LC_ADMIN') {
          return res.status(400).json({ message: 'Only LC Admins can select winners for specific offers.' });
        }

        // Verify no other selected candidate
        const existingSelection = await Application.findOne({
          offerId: offer._id,
          status: 'SELECTED'
        });

        if (existingSelection && existingSelection._id.toString() !== application._id.toString()) {
          return res.status(400).json({
            message: `Candidate '${existingSelection.resumeSnapshot?.personalInfo?.fullName || 'another student'}' is already selected as the winner for this offer.`
          });
        }

        application.status = 'SELECTED';
        await application.save();

        // Mark other applications as NOT_SELECTED
        await Application.updateMany(
          { offerId: offer._id, _id: { $ne: application._id } },
          { $set: { status: 'NOT_SELECTED' } }
        );

        // Update Offer document with winner
        offer.finalSelectedApplication = application._id;
        offer.status = 'CLOSED';
        await offer.save();

        // Log the selection
        const auditLog = new AuditLog({
          action: 'NOMINATION_SELECTION',
          performedBy: userId,
          targetId: application._id,
          details: `LC Admin (${lc}) selected Candidate '${applicant.name}' as the winner for Specific Offer '${offer.title}'`
        });
        await auditLog.save();

      } else if (offer.lcScope === 'GLOBAL') {
        // Global Offer, selected by NC Admin from the nominees
        if (role !== 'NC_ADMIN') {
          return res.status(403).json({ message: 'Only NC Admin can make the final selection for Global Offers.' });
        }

        if (application.status !== 'NOMINATED') {
          return res.status(400).json({ message: 'Only nominated candidates can be selected as final winners for Global Offers.' });
        }

        application.status = 'SELECTED';
        await application.save();

        // Update other nominations/applications for this global offer to NOT_SELECTED
        await Application.updateMany(
          { offerId: offer._id, _id: { $ne: application._id } },
          { $set: { status: 'NOT_SELECTED' } }
        );

        // Update Offer document with winner
        offer.finalSelectedApplication = application._id;
        offer.status = 'CLOSED';
        await offer.save();

        // Log final selection
        const auditLog = new AuditLog({
          action: 'FINAL_SELECTION',
          performedBy: userId,
          targetId: application._id,
          details: `NC Admin selected Candidate '${applicant.name}' (from LC ${applicant.lc}) as the final winner for Global Offer '${offer.title}'`
        });
        await auditLog.save();
      }
    } else {
      // General status updates (e.g. REVIEWING, NOT_SELECTED, REJECTED)
      application.status = status;
      await application.save();
    }

    res.json({ message: `Application status updated to ${status}`, application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: error.message || 'Server error while updating status' });
  }
});

export default router;
