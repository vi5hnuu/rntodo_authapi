const { sendMail } = require('../utils/sendMail');
const { sendToken } = require('../utils/sendToken');
const { modal: UserModal } = require('../modals/UserModal')
const cloudinary = require('cloudinary')
const fs = require('fs');
const path = require('path');

module.exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const avatarPath = req.files.avatar.tempFilePath

    const otp = Math.floor(Math.random() * 1000000)
    const mycloud = await cloudinary.v2.uploader.upload(avatarPath, {
      folder: 'todoAvatars'
    })

    fs.rmSync(path.join(__dirname, '..', 'tmp'), { recursive: true })

    const user = await UserModal.create({
      name,
      email,
      password,
      avatar: {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE_MIN * 60 * 1000)
    })
    await sendMail(email, 'Verify your account', `Your otp is ${otp}. This otp is valid for ${process.env.OTP_EXPIRE_MIN} minutes`)

    sendToken(res, user, 201, 'OTP send to your email, please varify your account.')

  } catch (error) {
    res.status(500).json({ success: false, message: error })
  }
}

module.exports.verifyOtp = async (req, res) => {
  try {
    const otp = Number(req.body.otp)
    if (req.user.otp !== otp || req.user.otp_expiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid otp | expired.' })
    }

    req.user.verified = true;
    req.user.otp = null;
    req.user.otp_expiry = null;
    await req.user.save()
    sendToken(res, req.user, 200, 'Account verified...')
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'invalid email/password' })
    }
    const user = await UserModal.findOne({ email: email })
      .select('+password')

    if (!user) {
      return res.status(400).json({ success: false, message: 'invalid email/password' })
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'invalid email/password' })
    }
    sendToken(res, user, 200, 'Login successful')
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.logoutUser = async (req, res) => {
  try {
    res.status(200).cookie("token", null, {
      httpOnly: true, expires: new Date(Date.now())
    }).json({ success: true, message: 'Logout successful' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}


module.exports.addTask = async (req, res) => {
  try {
    const { title, description } = req.body

    req.user.tasks.push({
      title, description, completed: false, createdAt: new Date()
    })
    await req.user.save()
    res.status(200).json({ success: true, message: 'Task added.' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
module.exports.removeTask = async (req, res) => {
  try {
    const { taskId } = req.params

    req.user.tasks = req.user.tasks.filter(task => task._id.toString() !== taskId)
    await req.user.save()
    res.status(200).json({ success: true, message: 'Task deleted.' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await req.user.tasks
      .find(task => task._id.toString() === taskId)
    task.completed = !task.completed;

    await req.user.save()
    res.status(200).json({ success: true, message: 'Task updated.' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}


module.exports.getMyProfile = async (req, res) => {
  try {
    sendToken(res, req.user, 200, `Welcome back ${req.user.name}`)
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body
    const avatarPath = req.files.avatar?.tempFilePath
    if (avatarPath) {
      if (req.user.avatar.public_id)
        await cloudinary.v2.uploader.destroy(req.user.avatar.public_id)
      const mycloud = await cloudinary.v2.uploader.upload(avatarPath, {
        folder: 'todoAvatars'
      })
      req.user.avatar.public_id = mycloud.public_id
      req.user.avatar.url = mycloud.secure_url
      fs.rmSync(path.join(__dirname, '..', 'tmp'), { recursive: true })
    }

    if (name) {
      req.user.name = name
    }
    await req.user.save()
    res.status(200)
      .json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body
    if ((!newPassword || !confirmPassword) || newPassword !== confirmPassword) {
      return res.status(400)
        .json({ success: false, message: 'new password and confirm password does not match/invalid.' })
    }
    if (!oldPassword) {
      return res.status(400)
        .json({ success: false, message: 'invalid old password!' })
    }
    const isMatch = await req.user.comparePassword(oldPassword)
    if (!isMatch) {
      return res.status(400)
        .json({ success: false, message: 'wrong password!' })
    }
    req.user.password = newPassword

    await req.user.save()
    res.status(200)
      .json({ success: true, message: 'password updated successfully' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}


//password management
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await UserModal.findOne({ email })
    if (!user) {
      return res.status(400)
        .json({ success: false, message: 'Invalid email!' })
    }
    //start pass reset
    user.verified = false
    const otp = Math.floor(Math.random() * 1000000)
    user.resetPasswordOtp = otp
    user.resetPasswordOtp_expiry = new Date(Date.now() + process.env.OTP_EXPIRE_MIN * 60 * 1000)
    await user.save()

    const message = `Your otp for resetting password is ${otp}. This otp is valid for ${process.env.OTP_EXPIRE_MIN} minutes. If you didn't requested for resetting password please ignore this message.`

    await sendMail(email, 'Reset password', message)

    res.status(200)
      .json({ success: true, message: 'otp sent...' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
module.exports.resetPassword = async (req, res) => {
  try {
    const { otp, newpassword } = req.body
    const user = await UserModal.findOne({ resetPasswordOtp: otp, resetPasswordOtp_expiry: { $gt: Date.now() } })
    if (!user) {
      return res.status(400)
        .json({ success: false, message: 'Otp invalid or expired!' })
    }
    if (!newpassword) {
      return res.status(400)
        .json({ success: false, message: 'please provide new password!' })
    }
    user.verified = true
    user.resetPasswordOtp = null
    user.resetPasswordOtp_expiry = null
    user.password = newpassword
    await user.save()
    sendToken(res, user, 200, 'password reset successful.')
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}