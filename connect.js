const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const URI = process.env.URI;
  
//db
mongoose.Promise = global.Promise;

const connectDB = async () => {
  await mongoose
    .connect(URI, {
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => console.log("DB Connected!"))
    .catch(err => {
      console.log(`DB Connection Error: ${err.message}`);
    });
};

module.exports = connectDB;
