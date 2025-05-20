// const mongoose = require('mongoose');

// const EarnSchema = new mongoose.Schema({

//   amount: { 
//     type: String, 
//     required: true,
//     trim: true
//   },
//   earn:{
//     type:String,
//     required: true,
//     trim: true
//   },
//   secondaryIdCounts: {
//     type: [String], // Array of unique secondaryId values
//     required: true,
//     default: [], // Ensure it’s never null
//   },

//   uniqueId:{
//     type: String,
//     unique:false,
//   },

//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   count:{
//     type: String,
//     unique:false,
//   }
// });

// module.exports = mongoose.model('Earn', EarnSchema);
const mongoose = require('mongoose');

const EarnSchema = new mongoose.Schema({
  amount: { 
    type: String, 
    required: true,
    trim: true
  },
  earn: {
    type: String,
    required: true,
    trim: true
  },
  secondaryIdCounts: {
    type: [String], // Array of unique secondaryId values
    required: true,
    default: [], // Ensure it’s never null
  },
  uniqueId: {
    type: String,
    unique: false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  count: {
    type: Number, // Changed from String to Number
    default: 0, // Default to 0 for new documents
  }
});

module.exports = mongoose.model('Earn', EarnSchema);