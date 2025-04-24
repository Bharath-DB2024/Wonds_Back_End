require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const twilio = require("twilio");
const axios=require("axios");



const router = express.Router();

// Twilio Credentials from environment variables
const accountSid ="ACa2f458d586d7ffbb40ed2a8efa03edbe";
const authToken = "c451a0ebdace8d6652dd461c4715cd10";
const twilioPhoneNumber = "+19472829948";
const client = new twilio(accountSid, authToken);



// OTP Schema
const otpSchema = new mongoose.Schema({
  phone: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 }, // OTP expires in 5 minutes
});

const OTP = mongoose.model("OTP", otpSchema);

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// API to send OTP
router.post("/send-otp", async (req, res) => {
    console.log(req.body);
    
  const { phone } = req.body;

  const otp = generateOTP();
  const message=`Your OTP is ${otp}.
     Share this with the retailer only if you're collecting cash on behalf of Wonds by Cyboglabs. Need help? Call 1800 410 1155.&fl=0&dc=0&gwid=2`

  try {
    // Send OTP via Twilio
   
    sendOtp(phone,message ); // to pass the  message to the sendOtp function
    // to update a opt in the database
    await OTP.findOneAndUpdate(
      { phone },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "OTP sending failed", error });
  }
});

// API to verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const storedOtp = await OTP.findOne({ phone });

  if (storedOtp && storedOtp.otp === otp) {
    await OTP.deleteOne({ phone }); // Remove OTP after successful verification
    res.json({ success: true, message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});


router.post("/send-Subcription", async (req, res) => {
  console.log(req.body);
  
const { phone } = req.body;
const message=`Thank you for subscribing to Wonds by Cyboglabs, ${phone}! No more worrying about lost bills, missed dates, or service centre runs. We handle it all. Know more: wonds.in | 1800 410 1155.&fl=0&dc=0&gwid=2`

try {
  // Send OTP via Twilio
 
  sendOtp(phone,message ); // to pass the  message to the sendOtp function
  // to update a opt in the database
  await OTP.findOneAndUpdate(
    { phone },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: "OTP sent successfully!" });
} catch (error) {
  res.status(500).json({ success: false, message: "OTP sending failed", error });
}
});
const sendOtp = async (mobileNumber,message) => {
  try {
    const apiKey = process.env.apiKey; // Replace with your actual API key
    const senderId =  process.env.senderId; // Must be approved sender ID
 
    const url = `http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=${apiKey}&msisdn=${mobileNumber}&sid=${senderId}&msg=${message}`;

    const response = await axios.get(url);
    

    console.log('SMSIndiaHub Response:', response.data);
  } catch (error) {
    console.error('Failed to send OTP:', error.message);
  }
};

  module.exports = router;