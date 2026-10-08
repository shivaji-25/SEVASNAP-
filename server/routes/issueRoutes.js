const express = require('express');
const router = express.Router();
const {
  getIssues,
  getNearbyIssues,
  checkDuplicateIssue,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  updateStatus,
  upvoteIssue,
} = require('../controllers/issueController');

// Dedicated MongoDB Geospatial Search & Duplicate Check endpoints
router.get('/nearby', getNearbyIssues);
router.post('/check-duplicate', checkDuplicateIssue);

// CRUD endpoints (SRS Module 4)
router.route('/').get(getIssues).post(createIssue);
router.route('/:id').get(getIssueById).put(updateIssue).delete(deleteIssue);

// Status Lifecycle API (SRS Module 5)
router.post('/:id/status', updateStatus);

// Upvote API (SRS Module 6)
router.post('/:id/upvote', upvoteIssue);

module.exports = router;
