const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  mobile: { 
    type: String,
    unique:false,
    match: /^[0-9]{10}$/
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  plan: { 
    type: String, 
    required: true,
    enum: ['₹29 BASIC', '₹49 STANDARD', '₹299 PROFESSIONAL', '₹349 Other']
  },
  category: { 
    type: String, 
    default: '',
    enum: ['', 'Electronic Product', 'Electrical Product', 'Other Products']
  },
  uniqueId:{
    type: String,
    unique:false,
  },
  settlement:{
  type :Boolean,
  unique:false,
  require:false
  },
  documents: {
    invoice: {
      filename: { type: String, required: true }, // Stores original filename
      data: { type: Buffer, required: true },     // Stores file binary data
      size: { type: Number, required: true },
      mimetype: { type: String, required: true }
    },
    warranty: {
      filename: String,
      data: Buffer,
      size: Number,
      mimetype: String
    },
    others: {
      filename: String,
      data: Buffer,
      size: Number,
      mimetype: String
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  secondaryUniqueId: {
    type: String,
    unique: true, // Ensure this is unique across all documents
    required: true
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);