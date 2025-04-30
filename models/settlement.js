const mongoose = require('mongoose');

const SettlemetSchema = new mongoose.Schema({
  mobile: { 
    type: String,
    unique:false,
    match: /^[0-9]{10}$/
  },
  amount: { 
    type: String, 
    required: true,
    trim: true
  },
  secondaryIdCounts: {
    type: [String], // Array of unique secondaryId values
    required: true,
    default: [], // Ensure it’s never null
  },

  uniqueId:{
    type: String,
    unique:false,
  },
  name:{
    type: String,
    unique:false,
  },
  status:{
    type: String,
    unique:false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  count:{
    type: String,
    unique:false,
  }
});

module.exports = mongoose.model('Settlement', SettlemetSchema);