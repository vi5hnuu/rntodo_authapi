const mongoose = require('mongoose');

function connectDB() {
  process.nextTick(async () => {
    try {
      const res = await mongoose.connect(process.env.MONGO_URL)
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