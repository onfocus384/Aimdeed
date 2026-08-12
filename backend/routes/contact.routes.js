const express = require("express");
const { transporter, fromAddress } = require("../config/email");
const { limiter } = require("../services/redis/rateLimits");
const logger = require("../utils/logger");

const router = express.Router();

router.post("/contact", limiter("contact"), async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: "onfocus384@gmail.com",
      subject: `📩 New Contact: ${name}`,
      html: `
        <h3>New Contact Form Submission — Aimdeed</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
    });

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "We've Received Your Message — Aimdeed Support",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e2a4a,#0f172a);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:600px;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#0ea5e9);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Aimdeed</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">NEET &amp; JEE Preparation Platform</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">Hello <strong style="color:#e2e8f0;">${name}</strong>,</p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        Thank you for contacting <strong style="color:#818cf8;">Aimdeed</strong>.
                      </p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        We have successfully received your message and our team will review it shortly.
                      </p>
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 32px;">
                        Our support team will get back to you as soon as possible. Most queries are usually responded to within <strong style="color:#38bdf8;">24–48 hours</strong>.
                      </p>
                      <hr style="border:none;border-top:1px solid rgba(99,102,241,0.25);margin:0 0 32px;">
                      <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 4px;">
                        Thank you for being part of the <strong style="color:#818cf8;">AIMDEED</strong> community.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:rgba(0,0,0,0.3);padding:24px 40px;text-align:center;border-top:1px solid rgba(99,102,241,0.2);">
                      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                        Best regards,<br>
                        <strong style="color:#94a3b8;">Aimdeed Support Team</strong><br>
                        🌐 <a href="https://aimdeed.in" style="color:#38bdf8;text-decoration:none;">aimdeed.in</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return res.json({
      success: true,
      message:
        "Thank you! We have received your message. A confirmation email has been sent to you.",
    });
  } catch (error) {
    logger.error("Email send failed", { err: error.message, email });
    return res.status(500).json({
      success: false,
      message: "Message received, but email failed to send.",
    });
  }
});

module.exports = router;
