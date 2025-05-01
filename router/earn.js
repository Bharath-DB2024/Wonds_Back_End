const express = require('express');
const Subscription = require('../models/subscription'); // Import schema

const router = express.Router();

router.post('/earn', async (req, res) => {
  try {
    const { uniqueId } = req.body; 
    console.log(uniqueId);
    
    

    if (!uniqueId) {
      return res.status(400).json({ error: "Unique identifier is required" });
    }

    // Get today's date and format it for correct date filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // console.log('Filtering from:', today.toISOString(), 'to', endOfDay.toISOString(), 'for unique:', uniqueId);

    // Find today's subscriptions filtered by `unique`
    const todaySubscriptions = await Subscription.find({
      uniqueId: uniqueId,  // Filter based on unique field
      createdAt: { $gte: today, $lte: endOfDay },
      settlement:null
    });
    const todaySubscriptions1 = await Subscription.find({
      uniqueId: uniqueId,  // Filter based on unique field
      createdAt: { $gte: today, $lte: endOfDay },
     
    });

    // Find all subscriptions filtered by `unique`
    const allSubscriptions = await Subscription.find({ uniqueId: uniqueId });
    // console.log(todaySubscriptions);
    
    // Function to calculate total amount from the `plan` field
    const calculateTotalAmount = (subscriptions) => {
      return subscriptions.reduce((sum, sub) => {
        const match = sub.plan.match(/\d+/); // Extracts the first number from the plan string
        const amount = match ? parseInt(match[0], 10) : 0; // Convert to integer
        return sum + amount;
      }, 0);
    };

    // Calculate earnings for today and total earnings
    const todayEarnings = calculateTotalAmount(todaySubscriptions);
    const totalEarnings = calculateTotalAmount(allSubscriptions);

    // console.log(`Subscriptions on ${today.toISOString().split('T')[0]}:`, todaySubscriptions.length);
    // console.log(`Today's Earnings: ₹${todayEarnings}`);
    // console.log(`Total Subscriptions for unique ${uniqueId}: ${allSubscriptions.length}`);
    // console.log(`Total Earnings for unique ${uniqueId}: ₹${totalEarnings}`);

    res.status(200).json({
      date: today.toISOString().split('T')[0], // Example: "2025-03-26"
      todaycount: todaySubscriptions1.length,
      todayearn: `${todayEarnings}`, // Today's earnings without currency symbol
      totalearn: `${totalEarnings}` // Total earnings without currency symbol
    });

  } catch (error) {
    console.error('Error fetching subscription data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/earnhistory', async (req, res) => {
  
  try {
    const { uniqueId } = req.body;
    console.log(uniqueId);
    
    if (!uniqueId) {
      return res.status(400).json({ error: "Unique identifier is required" });
    }

    // Get all subscriptions for the uniqueId
    const allSubscriptions = await Subscription.find({ uniqueId: uniqueId })
      .sort({ createdAt: -1 }); // Sort by date descending

    if (!allSubscriptions.length) {
      return res.status(200).json({
        history: [],
        totalearn: "0"
      });
    }

    // Function to calculate amount from plan
    const calculateAmount = (plan) => {
      const match = plan.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    // Group subscriptions by date
    const earningsByDate = {};
    let totalEarnings = 0;

    allSubscriptions.forEach(sub => {
      const date = new Date(sub.createdAt);
      const dateKey = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      if (!earningsByDate[dateKey]) {
        earningsByDate[dateKey] = {
          count: 0,
          amount: 0,
          date: dateKey
        };
      }

      const amount = calculateAmount(sub.plan);
      earningsByDate[dateKey].count += 1;
      earningsByDate[dateKey].amount += amount;
      totalEarnings += amount;
    });

    // Convert to array and sort by date
    const history = Object.values(earningsByDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Log the results
    history.forEach(day => {
      console.log(`Date: ${day.date}`);
      console.log(`Subscriptions: ${day.count}`);
      console.log(`Earnings: ₹${day.amount}`);
    });
    console.log(`Total Earnings for unique ${uniqueId}: ₹${totalEarnings}`);

    res.status(200).json({
      history: history.map(day => ({
        date: day.date,
        count: day.count,
        earn: `${day.amount}` // String without currency symbol
      })),
      totalearn: `${totalEarnings}`
    });

  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
