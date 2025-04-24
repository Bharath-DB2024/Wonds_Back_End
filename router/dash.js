const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/login");
const Subscription = require('../models/subscription'); // Import schema
require("dotenv").config();

const router = express.Router();

// 📌list partners

  router.post("/dash", async (req, res) => {
    try {
      // Fetch all users from the database
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of the day
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // End of the day
      
      // Count all subscriptions
      const totalSubscriptions = await Subscription.countDocuments({});
      
      // Count only today's subscriptions
      const todaySubscriptions = await Subscription.countDocuments({
        createdAt: {
          $gte: today,
          $lte: endOfDay
        }
      });
   
      const allPartners = await User.countDocuments({});
    //   const result = await Promise.all(
    //     allUsers.map(async (user) => {
    //       const subscriptions = await Subscription.find({ uniqueId: user.uniqueId });
      
    //       const itemCount = subscriptions.length;
      
    //       const totalAmount = subscriptions.reduce((sum, sub) => {
    //         const match = sub.plan.match(/[\d.]+/); // Matches ₹29, ₹299.99, etc.
    //         const amount = match ? parseFloat(match[0]) : 0;
    //         return sum + amount;
    //       }, 0);
      
    //       return {
    //         ...user._doc,
    //         itemCount,
    //         totalAmount
    //       };
    //     })
    //   );
  
      // Calculate total plan amount across all users
      
  
      res.json({
        totalSubscriptions,
        todaySubscriptions,
       allPartners,
      });
    } catch (error) {
      console.error("Error retrieving users or subscriptions:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

  
  module.exports = router;