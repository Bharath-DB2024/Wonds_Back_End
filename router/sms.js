require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const twilio = require("twilio");
const axios=require("axios");
const Subscription = require('../models/subscription'); // Import Subscription schema
const Settlement = require('../models/settlement'); // Import Settlement schema


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
  const { phone, otp,uniqueId} = req.body;

  console.log(req.body);
  const date = new Date();
  const storedOtp = await OTP.findOne({ phone });
 


  if (storedOtp && storedOtp.otp === otp) {
      const name = "Wonds by Cyboglabs"; // Set the name to Wonds by Cyboglabs
      const status = "success"; // Set status to success if OTP is valid
    await OTP.deleteOne({ phone }); // Remove OTP after successful verification
     if (!uniqueId) {
          return res.status(400).json({ error: "Unique identifier is required" });
        }
        if (!date) {
          return res.status(400).json({ error: "Date is required" });
        }
        if (!phone) {
          return res.status(400).json({ error: "Phone number is required" });
        }
    
        // Validate phone number format (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ error: "Phone number must be a 10-digit number" });
        }
    
        // Parse the provided date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
    
        // Find subscriptions for the given date and uniqueId
        const todaySubscriptions = await Subscription.find({
          uniqueId: uniqueId,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
            
          },
          settlement:null,
        });
    
        // Update settlement to true for matching subscriptions
        if (todaySubscriptions.length > 0) {
          await Subscription.updateMany(
            {
              uniqueId: uniqueId,
              createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
              },
            },
            { $set: { settlement: true } }
          );
        }
    
        // Extract unique secondaryId values
        const secondaryIdCounts = [...new Set(todaySubscriptions.map(sub => sub.secondaryUniqueId || 'unknown'))];
    
        // Calculate total amount
        const calculateTotalAmount = (subscriptions) => {
          return subscriptions.reduce((total, sub) => {
            const planValue = parseFloat(sub.plan.match(/₹(\d+)/)?.[1] || 0);
        
            let adjustedAmount = planValue;
        
            // Apply reduction rules
            if (planValue === 29) {
              adjustedAmount -= 10;
            } else if (planValue === 49) {
              adjustedAmount -= 30;
            }
        
            // Prevent negative values
            if (adjustedAmount < 0) adjustedAmount = 0;
        
            return total + adjustedAmount;
          }, 0);
        };
        
    
        // Calculate total amount and count
        const totalAmount = calculateTotalAmount(todaySubscriptions);
        const subscriptionLength = todaySubscriptions.length;
    

        const calculateEarnAmount = (subscriptions) => {
          return subscriptions.reduce((total, sub) => {
            const planValue = parseFloat(sub.plan.match(/₹(\d+)/)?.[1] || 0);
    
            let adjustedAmount = planValue;
    
            // Apply reduction rules
            if (planValue === 29) {
              adjustedAmount -= 19;
            } else if (planValue === 49) {
              adjustedAmount -= 15;
            }
    
            // Prevent negative values
            if (adjustedAmount < 0) adjustedAmount = 0;
    
            return total + adjustedAmount;
          }, 0);
        };
    
        const totalEarn = calculateEarnAmount(todaySubscriptions); // This is the adjusted amount for "earn"
    
        // Create a single settlement record
        if (subscriptionLength > 0) {
           const newSettlement = new Settlement({
             mobile: phone,
             amount: totalAmount, // Total amount for all subscriptions
             uniqueId: uniqueId,
              earn: totalEarn,
             secondaryIdCounts: secondaryIdCounts.map(id => (id === 'unknown' ? null : id)), // Convert 'unknown' to null
             createdAt: new Date(),
             name: name,
             status: status,
             count: subscriptionLength, // Total count of subscriptions
           });
       
           // Save the settlement record
           await newSettlement.save();
       
         }// Response with total amount, coun
        // Response with total amount, count, and secondaryId counts
        // res.status(200).json({
        //   totalAmount,
        //   length: subscriptionLength,
        //   secondaryIdCounts, // Return the array of secondaryIds
        // });
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