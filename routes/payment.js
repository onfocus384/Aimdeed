router.get("/pay/:amount", async (req, res) => {
  const amount = Number(req.params.amount);

  const upiId = "aimdeed@upi";
  const name = "AimDeed Pvt Ltd";

  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    name
  )}&am=${amount}&cu=INR`;

  const qrImage = await QRCode.toDataURL(upiLink);

  res.render("users/payment", {
    amount,     // ✅ REQUIRED
    qrImage,    // ✅ REQUIRED
  });
});
