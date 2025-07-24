
require('dotenv').config();
const Brevo = require('@getbrevo/brevo');

(async () => {
  try {
    console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY?.length);

    const api = new Brevo.TransactionalEmailsApi();
    api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY.trim());

    const email = new Brevo.SendSmtpEmail();
    email.sender = { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME };
    email.to = [{ email: 'er.kartik93@gmail.com' }];
    email.subject = 'Brevo auth test';
    email.htmlContent = '<p>If you got this, auth works.</p>';

    const res = await api.sendTransacEmail(email);
    console.log('Success:', res.body || res);
  } catch (e) {
    console.error('status:', e.response?.status);
    console.error('data:', e.response?.body || e.message);
  }
})();
