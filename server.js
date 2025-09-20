require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
}

const mailTransport = createTransport();

if (process.env.SERVE_STATIC === 'true') {
  const staticDir = process.env.STATIC_DIR || __dirname;
  app.use(express.static(path.resolve(staticDir)));
}

app.post('/api/contact', async (req, res) => {
  const firstName = (req.body['first-name'] || '').trim();
  const email = (req.body.email || '').trim();
  const company = (req.body.company || '').trim();
  const message = (req.body.message || '').trim();

  if (!firstName) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie Ihren Vornamen an.' });
  }

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
  }

  const notifyEmail = process.env.NOTIFY_EMAIL || process.env.SMTP_USER || 'notifications@example.com';
  const fromEmail = process.env.FROM_EMAIL || notifyEmail;
  const mailSubject = `Neue Anfrage von ${firstName}`;
  const mailText = `Vorname: ${firstName}\nE-Mail: ${email}\nFirma: ${company || '-'}\nNachricht:\n${message || '-'}\n`;

  try {
    const info = await mailTransport.sendMail({
      to: notifyEmail,
      from: fromEmail,
      replyTo: email,
      subject: mailSubject,
      text: mailText
    });

    if (info.message) {
      console.info('Kontaktformular gesendet:', info.message.toString());
    }

    return res.status(200).json({ success: true, message: 'Vielen Dank! Wir melden uns in Kürze bei Ihnen.' });
  } catch (error) {
    console.error('Fehler beim Senden der Kontaktanfrage:', error);
    return res.status(500).json({ success: false, error: 'Beim Versenden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.' });
  }
});

app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ success: false, error: 'Nicht gefunden' });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`MK Kassen API läuft auf Port ${port}`);
  });
}

module.exports = app;
