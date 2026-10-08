const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssueById,
  createIssue,
  updateStatus,
  upvoteIssue,
  checkDuplicate,
} = require('../controllers/issueController');

// 50-meter duplicate detection query
router.get('/check-duplicate', checkDuplicate);

// Issues CRUD & queries
router.route('/').get(getIssues).post(createIssue);
router.route('/:id').get(getIssueById);

// Status transition (non-reversible forward progression)
router.patch('/:id/status', updateStatus);

// Upvote endorsement
router.post('/:id/upvote', upvoteIssue);

module.exports = router;
