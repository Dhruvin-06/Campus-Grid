const express = require('express');
const router = express.Router();
const {
  getOpportunities, getOpportunityById, createOpportunity, updateOpportunity,
  verifyOpportunity, deleteOpportunity, saveOpportunity, getAllOpportunitiesAdmin,
} = require('../controllers/opportunityController');
const { protect, adminOnly, placementOrAdmin } = require('../middleware/auth');

// Student-facing
router.get('/', protect, getOpportunities);
router.get('/admin/all', protect, placementOrAdmin, getAllOpportunitiesAdmin);
router.get('/:id', protect, getOpportunityById);
router.put('/:id/save', protect, saveOpportunity);

// Placement Cell / Admin management
router.post('/', protect, placementOrAdmin, createOpportunity);
router.put('/:id', protect, placementOrAdmin, updateOpportunity);
router.delete('/:id', protect, placementOrAdmin, deleteOpportunity);

// Admin verification only
router.put('/:id/verify', protect, adminOnly, verifyOpportunity);

module.exports = router;
