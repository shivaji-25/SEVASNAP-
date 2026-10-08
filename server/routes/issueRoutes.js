const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  updateStatus,
  upvoteIssue,
} = require('../controllers/issueController');

// CRUD endpoints (SRS Module 4)
router.route('/').get(getIssues).post(createIssue);
router.route('/:id').get(getIssueById).put(updateIssue).delete(deleteIssue);

// Status Lifecycle API (SRS Module 5)
router.post('/:id/status', updateStatus);

// Upvote API (SRS Module 6)
router.post('/:id/upvote', upvoteIssue);

module.exports = router;
