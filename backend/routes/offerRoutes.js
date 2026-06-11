import express from 'express';
import Offer from '../models/Offer.js';
import AuditLog from '../models/AuditLog.js';
import { auth, requireNCAdmin, requireLCAdmin, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Generate unique offer code
const generateOfferCode = async (lcCode) => {
  const codePrefix = `IN-2026-${lcCode || 'GL'}`;
  const count = await Offer.countDocuments({ offerCode: new RegExp(`^${codePrefix}`) });
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `${codePrefix}-${nextNum}`;
};

// Create an offer (NC Admin only)
router.post('/', auth, requireNCAdmin, async (req, res) => {
  try {
    const { title, description, requirements, country, duration, payment, workType, lcScope, targetLc, deadline } = req.body;

    if (!title || !description || !country || !duration || !workType || !lcScope || !deadline) {
      return res.status(400).json({ message: 'Missing required fields including deadline' });
    }

    if (lcScope === 'SPECIFIC' && !['MU', 'MUJ', 'KU', 'JECRC'].includes(targetLc)) {
      return res.status(400).json({ message: 'Valid target LC is required for SPECIFIC scope' });
    }

    const finalTargetLc = lcScope === 'GLOBAL' ? null : targetLc;
    const offerCode = await generateOfferCode(finalTargetLc);

    const newOffer = new Offer({
      title,
      offerCode,
      description,
      requirements,
      country,
      duration,
      payment,
      workType,
      lcScope,
      targetLc: finalTargetLc,
      createdBy: req.user.id,
      releasedLcs: [],
      deadline: new Date(deadline),
      status: 'DRAFT'
    });

    await newOffer.save();

    // Create Audit Log
    const auditLog = new AuditLog({
      action: 'OFFER_CREATION',
      performedBy: req.user.id,
      targetId: newOffer._id,
      details: `Offer '${title}' (${offerCode}) created with deadline ${new Date(deadline).toLocaleDateString()}`
    });
    await auditLog.save();

    res.status(201).json(newOffer);
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Server error while creating offer' });
  }
});

// Get offers based on role and LC
router.get('/', auth, async (req, res) => {
  try {
    const { role, lc } = req.user;

    let query = {};

    if (role === 'NC_ADMIN') {
      // NC Admin sees everything
      query = {};
    } else if (role === 'LC_ADMIN') {
      // LC Admin sees offers targeted to their LC or Global offers
      query = {
        $or: [
          { lcScope: 'GLOBAL' },
          { lcScope: 'SPECIFIC', targetLc: lc }
        ]
      };
    } else if (role === 'MEMBER') {
      // Members see only offers released in their LC
      query = {
        releasedLcs: lc
      };
    }

    const offers = await Offer.find(query)
      .populate('createdBy', 'name email')
      .populate('finalSelectedApplication')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    console.error('Fetch offers error:', error);
    res.status(500).json({ message: 'Server error while fetching offers' });
  }
});

// Release an offer (NC Admin for global/all, LC Admin for specific/own)
router.put('/:id/release', auth, requireAdmin, async (req, res) => {
  try {
    const { role, lc, id: userId } = req.user;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (role === 'LC_ADMIN') {
      // LC Admins can only release specific offers targeted to their LC, or global offers for their LC
      if (offer.lcScope === 'SPECIFIC' && offer.targetLc !== lc) {
        return res.status(403).json({ message: 'You are not authorized to release offers targeted to another LC' });
      }

      if (!offer.releasedLcs.includes(lc)) {
        offer.releasedLcs.push(lc);
      }
    } else if (role === 'NC_ADMIN') {
      // NC Admin can release globally (which adds all LCs) or specific targets
      if (offer.lcScope === 'GLOBAL') {
        const allLcs = ['MU', 'MUJ', 'KU', 'JECRC'];
        allLcs.forEach(item => {
          if (!offer.releasedLcs.includes(item)) {
            offer.releasedLcs.push(item);
          }
        });
      } else {
        if (!offer.releasedLcs.includes(offer.targetLc)) {
          offer.releasedLcs.push(offer.targetLc);
        }
      }
    }

    offer.status = 'RELEASED';
    await offer.save();

    // Log the release
    const auditLog = new AuditLog({
      action: 'OFFER_RELEASE',
      performedBy: userId,
      targetId: offer._id,
      details: `Offer '${offer.title}' (${offer.offerCode}) released to: ${offer.releasedLcs.join(', ')}`
    });
    await auditLog.save();

    res.json({ message: 'Offer successfully released', offer });
  } catch (error) {
    console.error('Release offer error:', error);
    res.status(500).json({ message: 'Server error while releasing offer' });
  }
});

// Unrelease/revoke an offer (NC Admin or LC Admin)
router.put('/:id/unrelease', auth, requireAdmin, async (req, res) => {
  try {
    const { role, lc, id: userId } = req.user;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (role === 'LC_ADMIN') {
      if (offer.releasedLcs.includes(lc)) {
        offer.releasedLcs = offer.releasedLcs.filter(item => item !== lc);
      }
    } else if (role === 'NC_ADMIN') {
      // NC Admin revokes from everywhere
      offer.releasedLcs = [];
    }

    if (offer.releasedLcs.length === 0) {
      offer.status = 'DRAFT';
    }

    await offer.save();

    // Log the revoke
    const auditLog = new AuditLog({
      action: 'OFFER_UNRELEASE',
      performedBy: userId,
      targetId: offer._id,
      details: `Offer '${offer.title}' (${offer.offerCode}) revoked/unreleased ${role === 'LC_ADMIN' ? `from LC ${lc}` : 'globally'}`
    });
    await auditLog.save();

    res.json({ message: 'Offer successfully unreleased', offer });
  } catch (error) {
    console.error('Unrelease offer error:', error);
    res.status(500).json({ message: 'Server error while unreleasing offer' });
  }
});

// Close an offer (NC Admin or LC Admin if deadline passed)
router.put('/:id/close', auth, requireAdmin, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.status = 'CLOSED';
    await offer.save();

    res.json({ message: 'Offer status updated to CLOSED', offer });
  } catch (error) {
    console.error('Close offer error:', error);
    res.status(500).json({ message: 'Server error while closing offer' });
  }
});

// Delete offer (NC Admin only)
router.delete('/:id', auth, requireNCAdmin, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ message: 'Server error while deleting offer' });
  }
});

export default router;
