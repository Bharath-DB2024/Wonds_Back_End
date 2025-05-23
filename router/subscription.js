const express = require('express');
const multer = require('multer');
const Subscription = require('../models/subscription'); // Import schema
const Earn = require('../models/earn');
const { v4: uuidv4 } = require('uuid'); // Import UUID v4
const router = express.Router();
const axios=require("axios");
// Multer configuration using memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: { fileSize: 5000000 } // 5MB limit
});

// Subscription endpoint
// router.post('/subscribe', upload.fields([
//   { name: 'invoice', maxCount: 1 },
//   { name: 'warranty', maxCount: 1 },
//   { name: 'others', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { mobile, name, Plan, category, uniqueId } = req.body;
//  const name1="Hi "+name;
//     const files = req.files;
//     const invoiceFile = files['invoice'] ? files['invoice'][0] : null;
//     const warrantyFile = files['warranty'] ? files['warranty'][0] : null;
//     const othersFile = files['others'] ? files['others'][0] : null;

//     if (!mobile || !name || !Plan || !invoiceFile) {
//       return res.status(400).json({
//         error: 'Missing required fields',
//         details: {
//           mobile: !mobile ? 'Mobile is required' : null,
//           name: !name ? 'Name is required' : null,
//           Plan: !Plan ? 'Plan is required' : null,
//           invoice: !invoiceFile ? 'Invoice document is required' : null
//         }
//       });
//     }

//     // Generate a secondary unique ID
//     const secondaryUniqueId = uuidv4(); // Generates a unique UUID

//     const subscription = new Subscription({
//       mobile,
//       name,
//       plan: Plan,
//       uniqueId, // Original uniqueId from req.body
//       secondaryUniqueId, // New secondary unique ID
//       category: category || '',
//       documents: {
//         invoice: {
//           filename: invoiceFile.originalname,
//           data: invoiceFile.buffer,
//           size: invoiceFile.size,
//           mimetype: invoiceFile.mimetype
//         },
//         warranty: warrantyFile ? {
//           filename: warrantyFile.originalname,
//           data: warrantyFile.buffer,
//           size: warrantyFile.size,
//           mimetype: warrantyFile.mimetype
//         } : undefined,
//         others: othersFile ? {
//           filename: othersFile.originalname,
//           data: othersFile.buffer,
//           size: othersFile.size,
//           mimetype: othersFile.mimetype
//         } : undefined
//       }
//     });

//     await subscription.save();

//     // Log the subscription details including filename and data info
//     console.log('New subscription:', {
//       mobile,
//       name,
//       plan: Plan,
//       uniqueId,
//       secondaryUniqueId, // Log the secondary unique ID
//       category,
//       documents: {
//         invoice: { 
//           filename: invoiceFile.originalname, 
//           size: invoiceFile.size,
//           dataLength: invoiceFile.buffer.length
//         },
//         warranty: warrantyFile ? { 
//           filename: warrantyFile.originalname, 
//           size: warrantyFile.size,
//           dataLength: warrantyFile.buffer.length 
//         } : null,
//         others: othersFile ? { 
//           filename: othersFile.originalname, 
//           size: othersFile.size,
//           dataLength: othersFile.buffer.length 
//         } : null
//       }
//     });

  
//     const message=`Thank you for subscribing to Wonds by Cyboglabs, ${name1}! No more worrying about lost bills, missed dates, or service centre runs. We handle it all. Know more: wonds.in | 1800 410 1155.&fl=0&dc=0&gwid=2`
    
    
//       sendOtp(mobile,message );
//     res.status(200).json({
//       message: 'Subscription created successfully',
//       subscriptionId: subscription._id,
//       secondaryUniqueId // Include secondaryUniqueId in the response
//     });

//   } catch (error) {
//     console.error('Error processing subscription:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: error.message
//     });
//   }
// });

router.post('/subscribe', upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'warranty', maxCount: 1 },
  { name: 'others', maxCount: 1 }
]), async (req, res) => {
  try {
    const { mobile, name, Plan, category, uniqueId } = req.body;
    const name1 = "Hi " + name;
    const files = req.files;
    const invoiceFile = files['invoice'] ? files['invoice'][0] : null;
    const warrantyFile = files['warranty'] ? files['warranty'][0] : null;
    const othersFile = files['others'] ? files['others'][0] : null;

    // Validate required fields
    if (!mobile || !name || !Plan || !invoiceFile) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          mobile: !mobile ? 'Mobile is required' : null,
          name: !name ? 'Name is required' : null,
          Plan: !Plan ? 'Plan is required' : null,
          invoice: !invoiceFile ? 'Invoice document is required' : null
        }
      });
    }

    // Generate a secondary unique ID
    const secondaryUniqueId = uuidv4();

    // Create subscription
    const subscription = new Subscription({
      mobile,
      name,
      plan: Plan,
      uniqueId,
      secondaryUniqueId,
      category: category || '',
      documents: {
        invoice: {
          filename: invoiceFile.originalname,
          data: invoiceFile.buffer,
          size: invoiceFile.size,
          mimetype: invoiceFile.mimetype
        },
        warranty: warrantyFile ? {
          filename: warrantyFile.originalname,
          data: warrantyFile.buffer,
          size: warrantyFile.size,
          mimetype: warrantyFile.mimetype
        } : undefined,
        others: othersFile ? {
          filename: othersFile.originalname,
          data: othersFile.buffer,
          size: othersFile.size,
          mimetype: othersFile.mimetype
        } : undefined
      }
    });

    // Save subscription
    await subscription.save();

    // Truncate createdAt to start of the day for matching
    const subscriptionDate = new Date(subscription.createdAt);
    const startOfDay = new Date(subscriptionDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(subscriptionDate.setHours(23, 59, 59, 999));

    // Find or create Earn record for the same date
    const earn = await Earn.findOneAndUpdate(
      {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      },
      {
        $inc: { count: 1 }, // Increment count
        $push: { secondaryIdCounts: secondaryUniqueId }, // Append secondaryUniqueId
        $set: {
          amount: await Earn.findOne({ createdAt: { $gte: startOfDay, $lte: endOfDay } })
            .then(existing => (existing ? (parseInt(existing.amount) + 10).toString() : "10")), // Fixed to start at "10"
          earn: "subscription", // Explicitly set for both new and existing documents
          uniqueId: uniqueId || subscription._id.toString() // Explicitly set for both new and existing documents
        }
      },
      {
        upsert: true, // Create new document if none exists
        new: true, // Return the updated document
        setDefaultsOnInsert: {
          createdAt: subscription.createdAt,
          count: 0 // Default count for new documents (before $inc)
        },
        runValidators: true // Enforce schema validation
      }
    );

    // Log subscription details
    console.log('New subscription:', {
      mobile,
      name,
      plan: Plan,
      uniqueId,
      secondaryUniqueId,
      category,
      documents: {
        invoice: { 
          filename: invoiceFile.originalname, 
          size: invoiceFile.size,
          dataLength: invoiceFile.buffer.length
        },
        warranty: warrantyFile ? { 
          filename: warrantyFile.originalname, 
          size: warrantyFile.size,
          dataLength: warrantyFile.buffer.length 
        } : null,
        others: othersFile ? { 
          filename: othersFile.originalname, 
          size: othersFile.size,
          dataLength: othersFile.buffer.length 
        } : null
      }
    });

    // Log Earn record
    console.log('Earn record:', {
      amount: earn.amount,
      earn: earn.earn,
      secondaryIdCounts: earn.secondaryIdCounts,
      uniqueId: earn.uniqueId,
      createdAt: earn.createdAt,
      count: earn.count
    });

    // Send OTP message
    const message = `Thank you for subscribing to Wonds by Cyboglabs, ${name1}! No more worrying about lost bills, missed dates, or service centre runs. We handle it all. Know more: wonds.in | 1800 410 1155.&fl=0&dc=0&gwid=2`;
    await sendOtp(mobile, message);

    // Respond with success
    res.status(200).json({
      message: 'Subscription created successfully',
      subscriptionId: subscription._id,
      secondaryUniqueId,
      earnId: earn._id
    });

  } catch (error) {
    console.error('Error processing subscription:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
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