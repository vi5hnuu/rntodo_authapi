const express = require('express')
const { registerUser, verifyOtp, loginUser, logoutUser, addTask, updateTask, removeTask, getMyProfile, updateProfile, updatePassword, forgotPassword, resetPassword } = require('../controllers/UserController')
const { isAuthenticated } = require('../middlewares/Auth')

const router = express.Router()

router.route('/register').post(registerUser)
router.route('/verifyotp').post([isAuthenticated, verifyOtp])
router.route('/login').post(loginUser)
router.route('/logout').get(logoutUser)
router.route('/newtask').post([isAuthenticated, addTask])
router.route('/task/:taskId')
  .get([isAuthenticated, updateTask])
  .delete([isAuthenticated, removeTask])
router.route('/me').get([isAuthenticated, getMyProfile])

router.route('/updateprofile').patch([isAuthenticated, updateProfile])
router.route('/updatepassword').patch([isAuthenticated, updatePassword])
router.route('/forgotpassword').post(forgotPassword)
router.route('/resetpassword').put(resetPassword)

module.exports.router = router