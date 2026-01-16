// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    enum: [499, 799, 999]
  },
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
    default: "PENDING"
  },
  upiLink: String,
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ["PHONEPE", "GOOGLE_PAY", "PAYTM", "OTHER", null],
    default: null
  },
  verifiedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  }
}, { 
  timestamps: true 
});

// Indexes
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete expired payments

module.exports= mongoose.model("Payment", paymentSchema);