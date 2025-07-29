const Brevo = require('@getbrevo/brevo');
const { brevoApiKey, senderEmail, senderName, otpTtlMinutes } = require('./config');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

async function sendOtpEmail(toEmail, otp) {
  const email = new Brevo.SendSmtpEmail();
  email.to = [{ email: toEmail }];
  email.sender = { email: senderEmail, name: senderName };
  email.subject = 'Your OTP code';
  email.htmlContent = `<p>Your OTP is <strong>${otp}</strong>. It expires in ${otpTtlMinutes} minutes.</p>`;

  await apiInstance.sendTransacEmail(email);
}

module.exports = { sendOtpEmail };
