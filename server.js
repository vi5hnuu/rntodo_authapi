const { app } = require('./app')
const dotenv = require('dotenv')
const path = require('path')
const { connectDB } = require('./config/database')
const cloudinary = require('cloudinary')

dotenv.config({ path: path.join(__dirname, 'config', 'config.js') })
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
})
connectDB()

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
})

