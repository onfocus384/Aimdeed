const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  googleId: String,
  displayName: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Apply passport-local-mongoose plugin
// Use simpler syntax for compatibility
userSchema.plugin(passportLocalMongoose);

// Password reset methods
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);