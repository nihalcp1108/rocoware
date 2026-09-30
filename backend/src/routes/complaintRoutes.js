const express = require('express');
const {
  createComplaint,
  getRegisteredComplaints,
  getCompletedComplaints,
  getComplaintStats,
  getComplaintById,
  markComplaintCompleted,
  deleteComplaint,
  exportCompletedComplaintsPDF,
  exportSingleComplaintPDF,
  searchShops,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All complaint routes are protected by authentication
router.use(protect);

router.get('/stats', getComplaintStats);
router.get('/completed', getCompletedComplaints);
router.get('/export/pdf', exportCompletedComplaintsPDF);
router.get('/shops/search', searchShops);

router.post('/', upload.single('image'), createComplaint);
router.get('/', getRegisteredComplaints);

router.get('/:id', getComplaintById);
router.get('/:id/pdf', exportSingleComplaintPDF);
router.patch('/:id/complete', markComplaintCompleted);
router.delete('/:id', deleteComplaint);

module.exports = router;
