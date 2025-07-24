require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Trying to connect with:", process.env.SMTP_HOST, process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) console.error("Connection Failed:", error);
  else console.log("Connection Success:", success);
});
