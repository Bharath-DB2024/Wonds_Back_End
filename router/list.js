const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/login");
const Subscription = require('../models/subscription'); // Import schema
require("dotenv").config();

const router = express.Router();
router.post('/subscribe', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).lean();
    
    const result = await Promise.all(
      subscriptions.map(async (user) => {
        const userSubscriptions = await User.find({ uniqueId: user.uniqueId }).lean();
        const shopName = userSubscriptions.length > 0 ? userSubscriptions[0].shopName : null;
        
        let expirationDate;
        const createdDate = new Date(user.createdAt);
        
        switch (user.plan) {
          case "₹29 BASIC":
            expirationDate = new Date(createdDate.setDate(createdDate.getDate() + 2));
            break;
          case "₹49 STANDARD":
            // Note: I think you meant setMonth, not setDate with getDate + 1
            expirationDate = new Date(createdDate.setMonth(createdDate.getMonth() + 1));
            break;
          default:
            expirationDate = null;
        }

        const formattedDate = expirationDate ? expirationDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : null;

        const isExpired = expirationDate ? new Date() > expirationDate : false;

        return {
          ...user,
          shopName,
          expirationDate: formattedDate,
          isExpired
        };
      })
    );
    
    // Separate into expired and non-expired
    const expired = result.filter(sub => sub.isExpired === true);
    const active = result.filter(sub => sub.isExpired === false);

    // console.log({ expired, active });
    res.json({ 
     expired,  
      active 
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Error fetching subscriptions' });
  }
});

// 📌list partners
router.post("/partner", async (req, res) => {
    try {
      // Fetch all users from the database
      const allUsers = await User.find({});
      console.log("Retrieved all users:", allUsers);
    console.log(allUsers);
    
      res.json({
      
         allUsers
      });
    } catch (error) {
      console.error("Error retrieving users:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  router.post("/partner/dash", async (req, res) => {
    try {
      // Fetch all users from the database
      const allUsers = await User.find({});
  
      const result = await Promise.all(
        allUsers.map(async (user) => {
          const subscriptions = await Subscription.find({ uniqueId: user.uniqueId });
      
          const itemCount = subscriptions.length;
      
          const totalAmount = subscriptions.reduce((sum, sub) => {
            const match = sub.plan.match(/[\d.]+/); // Matches ₹29, ₹299.99, etc.
            const amount = match ? parseFloat(match[0]) : 0;
            return sum + amount;
          }, 0);
      
          return {
            ...user._doc,
            itemCount,
            totalAmount
          };
        })
      );
  
      // Calculate total plan amount across all users
      const totalPlanAmount = result.reduce((sum, user) => sum + user.planAmount, 0);
  
      res.json({
      
        result, // Optional: Include result for debugging
      });
    } catch (error) {
      console.error("Error retrieving users or subscriptions:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

  
 
  module.exports = router;