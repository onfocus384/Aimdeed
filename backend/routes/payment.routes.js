const express = require("express");
const QRCode = require("qrcode");
const { supabaseAdmin } = require("../config/supabase");
const { isLoggedIn } = require("../middleware/auth");
const { limiter } = require("../services/redis/rateLimits");
const logger = require("../utils/logger");

const router = express.Router();

const ALLOWED_AMOUNTS = [499, 799, 999];

// Get available plans
router.get("/plans", limiter("plans"), (req, res) => {
  return res.json({ amounts: ALLOWED_AMOUNTS });
});

// Generate QR for selected amount
router.post("/generate-qr", limiter("generateQr"), isLoggedIn, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!ALLOWED_AMOUNTS.includes(Number(amount))) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const upiId = process.env.UPI_ID;
    const merchantName = "Samprit Saha";

    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      merchantName,
    )}&am=${amount}&cu=INR`;

    const qrImage = await QRCode.toDataURL(upiLink);

    return res.json({ success: true, qrImage });
  } catch (error) {
    logger.error("QR generation error", { err: error.message });
    return res.status(500).json({ error: "Server error" });
  }
});

// Confirm payment after user submits UTR
router.post("/confirm", limiter("paymentConfirm"), isLoggedIn, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res
        .status(500)
        .json({ error: "Payment is unavailable. Server database is not configured." });
    }

    const { amount, utr, payerName } = req.body;

    if (!ALLOWED_AMOUNTS.includes(Number(amount))) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!utr) {
      return res.status(400).json({ error: "Transaction ID / UTR is required." });
    }

    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("utr_id", utr)
      .maybeSingle();

    if (existing) {
      return res
        .status(400)
        .json({ error: "This Transaction ID has already been used." });
    }

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: req.user.id,
        payer_name: payerName || null,
        amount: Number(amount),
        utr_id: utr,
        transaction_id: `AD${Date.now()}`,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "This Transaction ID has already been used." });
      }
      logger.error("Payment confirm error", { err: error.message });
      return res.status(500).json({ error: "Payment failed" });
    }

    return res.json({
      success: true,
      message: "Payment submitted successfully",
      amount: data.amount,
      transactionId: data.transaction_id,
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return res.status(500).json({ error: "Payment failed" });
  }
});

module.exports = router;
