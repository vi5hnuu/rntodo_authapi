const mongoose = require('mongoose');

function connectDB() {
  process.nextTick(async () => {
    try {
      const uri = process.env.MONGO_URL.replace('<MONGO_PASS>', process.env.MONGO_PASS).replace('<MONGO_USERNAME>', process.env.MONGO_USERNAME);
      const res = await mongoose.connect(uri)
      // console.log(res.connection);
    } catch (error) {
      process.exit(1)
    }
  })
  mongoose.connection.on('connected', () => {
    console.log('connected to DB');
  })
}

module.exports.connectDB = connectDB