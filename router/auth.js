const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/login");

const Subscription = require('../models/subscription'); // Subscription model
const Settlement = require('../models/settlement'); // Settlement model
require("dotenv").config();

const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log incoming data

    const {
      shopName,
      gstNumber,
      partnerName,
      mobileNumber,
      email,
      website,
      address,
      pincode,
      city,
      state,
      place,
      zone,
      country,
      accountType,
      username,
      password,
      confirmPassword,
      uniqueId, // Add uniqueId to the destructured body
    } = req.body;

    // Validate password match if password is provided (for both create and update)
    if (password && confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Normalize accountType to lowercase
    const normalizedAccountType = accountType ? accountType.toLowerCase() : 'basic';

    // Function to generate uniqueId based on shopName and mobileNumber
    const generateUniqueId = (shopName, mobileNumber) => {
      const words = shopName.trim().split(/\s+/).filter(word => word.length > 0);
      let shopCode = '';

      if (words.length === 1) {
        const word = words[0];
        if (word.length >= 3) {
          shopCode = word[0] + word.slice(-2);
        } else if (word.length === 2) {
          shopCode = word[0] + word[1] + word[1];
        } else {
          shopCode = word[0] + word[0] + word[0];
        }
      } else if (words.length === 2) {
        const firstWord = words[0];
        const secondWord = words[1];
        shopCode = firstWord[0] + firstWord[firstWord.length - 1] + secondWord[0];
      } else {
        shopCode = words.map(word => word[0]).join('').slice(0, 4);
      }

      shopCode = shopCode.toUpperCase();
      return `${shopCode}/${mobileNumber}`;
    };

    // Check if this is an update (uniqueId is provided) or a new registration
    if (uniqueId) {
      // Update existing user
      let user = await User.findOne({ uniqueId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Store the old uniqueId for updating related collections
      const oldUniqueId = user.uniqueId;

      // Check if the username is being changed and if the new username already exists
      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists' });
        }
      }

      // Check if shopName or mobileNumber changed, and regenerate uniqueId if necessary
      let newUniqueId = user.uniqueId;
      if (shopName !== user.shopName || mobileNumber !== user.mobileNumber) {
        newUniqueId = generateUniqueId(shopName, mobileNumber);
        const uniqueIdExists = await User.findOne({ uniqueId: newUniqueId, _id: { $ne: user._id } });
        if (uniqueIdExists) {
          return res.status(400).json({ message: 'New unique ID already exists' });
        }
      }

      // Update user fields in the User collection
      user.shopName = shopName;
      user.gstNumber = gstNumber;
      user.partnerName = partnerName;
      user.mobileNumber = mobileNumber;
      user.email = email;
      user.website = website;
      user.address = address;
      user.pincode = pincode;
      user.city = city;
      user.state = state;
      user.place = place;
      user.zone = zone;
      user.country = country;
      user.accountType = normalizedAccountType;
      user.username = username;
      user.uniqueId = newUniqueId;

      // Update password only if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      // Save updated user
      await user.save();

      // If uniqueId changed, update related collections
      if (oldUniqueId !== newUniqueId) {
        // Update Subscription collection
        await Subscription.updateMany(
          { uniqueId: oldUniqueId },
          { $set: { uniqueId: newUniqueId } }
        );

        // Update Settlement collection
        await Settlement.updateMany(
          { uniqueId: oldUniqueId },
          { $set: { uniqueId: newUniqueId } }
        );
      }

      res.json({
        message: 'User updated successfully!',
        uniqueId: user.uniqueId,
      });
    } else {
      // Create new user (original registration logic)
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Generate uniqueId
      const newUniqueId = generateUniqueId(shopName, mobileNumber);
      console.log('Generated uniqueId:', newUniqueId);

      // Check if uniqueId already exists
      user = await User.findOne({ uniqueId: newUniqueId });
      if (user) {
        return res.status(400).json({ message: 'Unique ID already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user with uniqueId
      user = new User({
        shopName,
        gstNumber,
        partnerName,
        mobileNumber,
        email,
        website,
        address,
        pincode,
        city,
        state,
        country,
        accountType: normalizedAccountType,
        username,
        password: hashedPassword,
        place,
        zone,
        uniqueId: newUniqueId,
      });

      // Save user
      await user.save();
    
      res.json({
        message: 'User registered successfully!',
        uniqueId: user.uniqueId,
      });
    }
  } catch (error) {
    console.error('Registration/Update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// 📌 Login Route
router.post("/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body);

    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if user exists
    let user = await User.findOne({ username });
    if (!user) {
      console.log("User not found for username:", username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Log passwords for debugging
    console.log("Provided password:", password);
    console.log("Stored hashed password:", user.password);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch for user:", user);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Password matches, proceed with login
    console.log("Login successful for uniqueId:", user.uniqueId);
    console.log("User:", user);

    // Optionally, generate a JWT token


    res.json({
     user:user
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});




router.post("/count", async (req, res) => {
  try {
    const zoneCountsArray = await User.aggregate([
      {
        $group: {
          _id: "$zone",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Convert array to object with zone names as keys
    const zoneCounts = {};
    zoneCountsArray.forEach(zone => {
      zoneCounts[zone._id] = zone.count;
    });

    res.json(zoneCounts);
  } catch (error) {
    console.error("Zone count error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
