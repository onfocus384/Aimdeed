const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const fromAddress = process.env.EMAIL_FROM
  ? `"Aimdeed Support" <${process.env.EMAIL_FROM}>`
  : `"Aimdeed Support" <${process.env.EMAIL_USERNAME}>`;

module.exports = { transporter, fromAddress };
