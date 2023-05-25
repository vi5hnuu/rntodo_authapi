const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required'],
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    unique: [true, 'email not available | please try something different'],
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minLength: [8, 'password length must be atleast 8 characters'],
    select: false
  },
  avatar: {
    public_id: String,
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tasks: [{
    title: String,
    description: String,
    completed: Boolean,
    createdAt: Date,
  }],
  verified: {
    type: Boolean,
    default: false
  },
  otp: Number,
  otp_expiry: Date,
  resetPasswordOtp: Number,
  resetPasswordOtp_expiry: Date
})

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(this.password, salt)
  this.password = hashedPassword
  next()
})
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}
UserSchema.methods.getToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_JWT, {
    expiresIn: process.env.JWT_COOKIE_EXPIRE_MIN * 60 * 1000
  })
  return token
}
UserSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 })

module.exports.modal = mongoose.model('User', UserSchema, 'users')