const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const {
  register, login, logout, getMe,
  forgotPassword, resetPassword, verifyEmail,
  updatePassword, updateProfile
} = require('../controllers/auth');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
];

router.post('/register', registerValidation, validate, register);
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', [body('email').isEmail()], validate, forgotPassword);
router.put('/resetpassword/:resettoken', [
  body('password').isLength({ min: 8 })
], validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.put('/updatepassword', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, updatePassword);
router.put('/updateprofile', protect, updateProfile);

module.exports = router;
