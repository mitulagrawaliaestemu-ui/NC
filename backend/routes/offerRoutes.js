import express from 'express';
import Offer from '../models/Offer.js';
import { auth, requireNCAdmin, requireLCAdmin } from '../middleware/auth.js';

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
    const { title, description, requirements, country, duration, payment, workType, lcScope, targetLc } = req.body;

    if (!title || !description || !country || !duration || !workType || !lcScope) {
      return res.status(400).json({ message: 'Missing required fields' });
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
      releasedLcs: [] // initially not released by any LC
    });

    await newOffer.save();
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

    const offers = await Offer.find(query).populate('createdBy', 'name email');
    res.json(offers);
  } catch (error) {
    console.error('Fetch offers error:', error);
    res.status(500).json({ message: 'Server error while fetching offers' });
  }
});

// Release an offer for an LC (LC Admin only)
router.put('/:id/release', auth, requireLCAdmin, async (req, res) => {
  try {
    const { lc } = req.user;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if the LC Admin is allowed to release it
    // They can release Global offers, or Specific offers targeted to their LC
    if (offer.lcScope === 'SPECIFIC' && offer.targetLc !== lc) {
      return res.status(403).json({ message: 'You are not authorized to release offers targeted to another LC' });
    }

    // Add LC to releasedLcs if not already present
    if (!offer.releasedLcs.includes(lc)) {
      offer.releasedLcs.push(lc);
      await offer.save();
    }

    res.json({ message: `Offer successfully released for LC ${lc}`, offer });
  } catch (error) {
    console.error('Release offer error:', error);
    res.status(500).json({ message: 'Server error while releasing offer' });
  }
});

// Unrelease an offer for an LC (LC Admin only)
router.put('/:id/unrelease', auth, requireLCAdmin, async (req, res) => {
  try {
    const { lc } = req.user;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.releasedLcs.includes(lc)) {
      offer.releasedLcs = offer.releasedLcs.filter(item => item !== lc);
      await offer.save();
    }

    res.json({ message: `Offer successfully unreleased for LC ${lc}`, offer });
  } catch (error) {
    console.error('Unrelease offer error:', error);
    res.status(500).json({ message: 'Server error while unreleasing offer' });
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
