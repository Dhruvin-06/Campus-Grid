const express = require('express');
const router = express.Router();
const {
  getOpportunities, getOpportunityById, createOpportunity, updateOpportunity,
  verifyOpportunity, deleteOpportunity, saveOpportunity, getAllOpportunitiesAdmin,
} = require('../controllers/opportunityController');
const { protect, adminOnly } = require('../middleware/auth');

// Student-facing
router.get('/', protect, getOpportunities);
router.get('/admin/all', protect, adminOnly, getAllOpportunitiesAdmin);
router.get('/:id', protect, getOpportunityById);
router.put('/:id/save', protect, saveOpportunity);

// Admin management
router.post('/', protect, adminOnly, createOpportunity);
router.put('/:id', protect, adminOnly, updateOpportunity);
router.delete('/:id', protect, adminOnly, deleteOpportunity);

// Admin verification only
router.put('/:id/verify', protect, adminOnly, verifyOpportunity);

module.exports = router;
