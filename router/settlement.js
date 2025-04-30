const express = require('express');
const Subscription = require('../models/subscription'); // Import Subscription schema
const Settlement = require('../models/settlement'); // Import Settlement schema
const settlement = require('../models/settlement');
const User = require("../models/login");
const axios = require("axios");

const router = express.Router();

// router.post('/settlement', async (req, res) => {
//   try {
//     const { uniqueId, date, phone ,name,status} = req.body; // Expecting phone, uniqueId, and date in the request body
//     console.log(uniqueId, date, phone);

//     // Validate required fields
//     if (!uniqueId) {
//       return res.status(400).json({ error: "Unique identifier is required" });
//     }
//     if (!date) {
//       return res.status(400).json({ error: "Date is required" });
//     }
//     if (!phone) {
//       return res.status(400).json({ error: "Phone number is required" });
//     }

//     // Validate phone number format (10 digits)
//     const phoneRegex = /^[0-9]{10}$/;
//     if (!phoneRegex.test(phone)) {
//       return res.status(400).json({ error: "Phone number must be a 10-digit number" });
//     }

//     // Parse the provided date (assuming it's in 'YYYY-MM-DD' format)
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0); // Start of the day
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999); // End of the day

//     // Find subscriptions for the given date (regardless of settlement status)
//     const todaySubscriptions = await Subscription.find({
//       uniqueId: uniqueId, // Filter by uniqueId
//       createdAt: {
//         $gte: startOfDay, // Greater than or equal to start of day
//         $lte: endOfDay    // Less than or equal to end of day
//       }
//     });

//     // Update settlement to true for all subscriptions matching the date
//     if (todaySubscriptions.length > 0) {
//       await Subscription.updateMany(
//         {
//           uniqueId: uniqueId,
//           createdAt: {
//             $gte: startOfDay,
//             $lte: endOfDay
//           }
//         },
//         { $set: { settlement: true } } // Set settlement to true
//       );
//     }

//     // Fetch the updated subscriptions for the given date
//     const updatedTodaySubscriptions = await Subscription.find({
//       uniqueId: uniqueId,
//       createdAt: {
//         $gte: startOfDay,
//         $lte: endOfDay
//       }
//     });

//     // Function to calculate total amount from the `plan` field
//     const calculateTotalAmount = (subscriptions) => {
//       return subscriptions.reduce((total, sub) => {
//         const planValue = parseFloat(sub.plan.match(/₹(\d+)/)?.[1] || 0); // Extract numeric value from plan
//         return total + planValue;
//       }, 0);
//     };

//     // Calculate total amount and length for the updated subscriptions
//     const totalAmount = calculateTotalAmount(updatedTodaySubscriptions);
//     const subscriptionLength = updatedTodaySubscriptions.length;

//     // Create a new settlement record
//     const newSettlement = new Settlement({
//       mobile: phone,           // Store the provided phone number
//       amount: totalAmount.toString(), // Convert totalAmount to string as per schema
//       uniqueId: uniqueId,      // Store the uniqueId
//       createdAt: new Date(),
//       name:name,
//       status:status, // Default to current date/time
//       count:subscriptionLength
//     });

//     // Save the settlement record to the database
//     await newSettlement.save();

//     // Response with the total amount and length
//     res.status(200).json({
//       totalAmount: totalAmount, // Total amount of plans for the given date
//       length: subscriptionLength // Number of subscriptions for the given date
//     });

//   } catch (error) {
//     console.error('Error fetching, updating, or saving settlement data:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/settlement', async (req, res) => {
  try {
    const { uniqueId, date, phone, name, status } = req.body;
    console.log(uniqueId, date, phone);

    // Validate required fields
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
        return total + planValue;
      }, 0);
    };

    // Calculate total amount and count
    const totalAmount = calculateTotalAmount(todaySubscriptions);
    const subscriptionLength = todaySubscriptions.length;

    // Create a single settlement record
    const newSettlement = new Settlement({
      mobile: phone,
      amount: totalAmount, // Total amount for all subscriptions
      uniqueId: uniqueId,
      secondaryIdCounts: secondaryIdCounts.map(id => (id === 'unknown' ? null : id)), // Convert 'unknown' to null
      createdAt: new Date(),
      name: name,
      status: status,
      count: subscriptionLength, // Total count of subscriptions
    });

    // Save the settlement record
    await newSettlement.save();

    // Response with total amount, count, and secondaryId counts
    res.status(200).json({
      totalAmount,
      length: subscriptionLength,
      secondaryIdCounts, // Return the array of secondaryIds
    });

  } catch (error) {
    console.error('Error fetching, updating, or saving settlement data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/settlementhistory', async (req, res) => {
  try {
    const { uniqueId, date, phone } = req.body; // Expecting phone, uniqueId, and date in the request body
    console.log(uniqueId, date, phone);

    // Validate required fields


    const updatedTodaySubscriptions = await Settlement.find({
      uniqueId: uniqueId,


    });
    // Function to calculate total amount from the `plan` field



    // Response with the total amount and length
    res.status(200).json({
      settlement: updatedTodaySubscriptions // Total amount of plans for the given date

    });

  } catch (error) {
    console.error('Error fetching, updating, or saving settlement data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/settlementhistory', async (req, res) => {
  try {
    const { uniqueId, date, phone } = req.body; // Expecting phone, uniqueId, and date in the request body
    console.log(uniqueId, date, phone);

    // Validate required fields


    const updatedTodaySubscriptions = await Settlement.find({
      uniqueId: uniqueId,


    });
    // Function to calculate total amount from the `plan` field



    // Response with the total amount and length
    res.status(200).json({
      settlement: updatedTodaySubscriptions // Total amount of plans for the given date

    });

  } catch (error) {
    console.error('Error fetching, updating, or saving settlement data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/settlementhistoryweb', async (req, res) => {
  try {


    console.log('settlement history web');


    const updatedTodaySubscriptions = await Settlement.find({});
    // Function to calculate total amount from the `plan` field



    // Response with the total amount and length
    res.status(200).json({
      settlement: updatedTodaySubscriptions // Total amount of plans for the given date

    });

  } catch (error) {
    console.error('Error fetching, updating, or saving settlement data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





router.post('/pending-settlements', async (req, res) => {
  try {
    // Get distinct dates with pending subscriptions (settlement not true)
    const pendingDates = await Subscription.aggregate([
      {
        $match: {
          settlement: { $ne: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
        },
      },
    ]).then((results) => results.map((r) => r.date));

    // Get all distinct uniqueId values
    const uniqueIds = await Subscription.distinct('uniqueId');

    if (!uniqueIds || uniqueIds.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }

    // Fetch pending subscriptions for each uniqueId
    const results = await Promise.all(
      uniqueIds.map(async (uniqueId) => {
        const pendingSubscriptions = await Subscription.find({
          uniqueId,
          settlement: { $ne: true },
        });

        const shop = await User.findOne({ uniqueId });

        // Group subscriptions by date
        const subscriptionsByDate = pendingSubscriptions.reduce((acc, sub) => {
          const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(sub);
          return acc;
        }, {});

        // Create date groups with required fields
        const dateGroups = Object.keys(subscriptionsByDate).map((date) => {
          const subscriptions = subscriptionsByDate[date];
          const pendingAmount = subscriptions.reduce((total, sub) => {
            const planValue = parseFloat(sub.plan.match(/₹(\d+)/)?.[1] || 0);
            return total + planValue;
          }, 0);
          return {

            uniqueId,
            shopName: shop ? shop.shopName : 'N/A',
            address: shop ? shop.address || 'N/A' : 'N/A',
            date,
            pendingAmount,
            pendingCount: subscriptions.length,
          };
        });

        return dateGroups;
      })
    );

    // Flatten and sort date groups
    const flattenedResults = results.flat().sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      pendingSettlements: flattenedResults,
      totalUniqueIds: uniqueIds.length,
      pendingDates,
    });
  } catch (error) {
    console.error('Error fetching pending settlements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Your existing /settlement POST route /// get a data  from subcription data  on settlement page
router.post('/histroyset', async (req, res) => {
  try {
    const { uniqueId } = req.body; // Expecting uniqueId in the request body
 console.log(uniqueId);
    // Validate input
    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId is required' });
    }

    // Find the settlement record by uniqueId and corresponding _id
    const settlement = await Settlement.findOne({_id: uniqueId });

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    // Extract secondaryIdCounts from the settlement
    const secondaryIds = settlement.secondaryIdCounts;

    // Find all subscriptions where secondaryUniqueId matches any of the secondaryIds, excluding documents
    const subscriptions = await Subscription.find({
      secondaryUniqueId: { $in: secondaryIds }
    }).select('mobile name plan category uniqueId settlement createdAt secondaryUniqueId'); // Exclude documents field

    // Prepare the response
    const response = {
      settlement: {
        _id: settlement._id,
        mobile: settlement.mobile,
        amount: settlement.amount,
        secondaryIdCounts: settlement.secondaryIdCounts,
        uniqueId: settlement.uniqueId,
        name: settlement.name,
        status: settlement.status,
        createdAt: settlement.createdAt,
        count: settlement.count
      },
      subscriptions: subscriptions, // Matching subscription records
      totalSubscriptions: subscriptions.length // Number of matching subscriptions
    };

    // Send the response
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching settlement or subscription data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;