const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  shopName: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:false
  },
  gstNumber: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:true
  },
  partnerName: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:false
  },
  mobileNumber: { 
    type: String, 
    required: true, 
    match: /^[0-9]{10}$/, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true ,
    
  },
  website: { 
    type: String, 
    trim: true 
  },
  address: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:false
  },
  pincode: { 
    type: String, 
    required: true, 
    match: /^[0-9]{6}$/, 
    trim: true ,
    unique:false
  },
  city: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:false
  },
  state: { 
    type: String, 
    required: true, 
    trim: true ,
    unique:false
  },
  country: { 
    type: String, 
    required: true, 
    trim: true 
  },
 place: { 
    type: String, 
    required: true, 
  
  },
  zone: { 
    type: String, 
    required: true, 
  
  },
  accountType: { 
    type: String, 
    required: true, 
    enum: ['basic', 'premium', 'enterprise'], 
    default: 'basic' 
  },
  username: { 
    type: String, 
    required: true, 
    unique:true
  },
  password: { 
    type: String, 
    required: true ,
    unique:false
    
  },
  uniqueId: { 
    type: String, 
    unique: true, // As per your requirement
    required: true ,
  },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;