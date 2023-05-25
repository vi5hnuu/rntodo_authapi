const express = require('express')
const { router: UserRouter } = require('./routes/UserRoute')
const cookieparser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')

const app = express()
app.use(cookieparser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true
}))
app.use('/api/v1', UserRouter)
app.use(cors())

exports.app = app