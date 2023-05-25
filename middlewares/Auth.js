const jwt = require('jsonwebtoken');
const { modal: UserModal } = require('./../modals/UserModal')

module.exports.isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Login first...' })
    }
    const decoded_data = jwt.verify(token, process.env.SECRET_JWT)
    console.log(decoded_data);
    req.user = await UserModal.findById(decoded_data._id).select('+password')
    next()
  } catch (error) {
    console.log('error');
    res.status(500).json({ success: false, message: error })
  }
}