

const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables
const dbURI = "mongodb://127.0.0.1:27017/Wonds_shope";
// const dbURI ="mongodb+srv://doadmin:Z4h3I892pP60Eu7w@db-mongodb-nyc3-57274-32169585.mongo.ondigitalocean.com/admin";
const connectDB = async () => {
  try {
    await mongoose.connect( dbURI, { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
