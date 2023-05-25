
function sendToken(res, user, statusCode, message) {
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    tasks: user.tasks,
    verified: user.verified
  }
  const token = user.getToken()
  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_MIN * 60 * 1000)
  }
  res.status(statusCode).cookie("token", token, options).json({ success: true, message, userData })
}

module.exports.sendToken = sendToken;