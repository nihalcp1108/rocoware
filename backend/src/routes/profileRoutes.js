const express = require('express');
const { updateEmail, updatePassword } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.put('/email', updateEmail);
router.put('/password', updatePassword);

module.exports = router;
