const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const templates = {
  emailVerification: ({ name, verifyUrl }) => ({
    subject: 'Verify Your Email – Golf Draw Platform',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#22c55e;font-size:28px;margin-bottom:8px">Welcome, ${name}!</h1>
        <p style="color:#a3a3a3;margin-bottom:32px">You're one step away from joining the Golf Draw Platform.</p>
        <a href="${verifyUrl}" style="background:#22c55e;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
          Verify Email Address
        </a>
        <p style="color:#525252;margin-top:32px;font-size:13px">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
      </div>
    `
  }),

  resetPassword: ({ name, resetUrl }) => ({
    subject: 'Password Reset – Golf Draw Platform',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#22c55e;font-size:28px;margin-bottom:8px">Password Reset</h1>
        <p style="color:#a3a3a3">Hi ${name}, you requested a password reset.</p>
        <a href="${resetUrl}" style="background:#22c55e;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:24px 0">
          Reset My Password
        </a>
        <p style="color:#525252;font-size:13px">This link expires in 10 minutes. If you didn't request this, please ignore.</p>
      </div>
    `
  }),

  winnerNotification: ({ name, matchType, prizeAmount, drawMonth }) => ({
    subject: `🏆 You Won the ${drawMonth} Golf Draw!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#f59e0b;font-size:32px">🏆 Congratulations, ${name}!</h1>
        <p style="color:#a3a3a3;font-size:18px">You achieved a <strong style="color:#fff">${matchType}</strong> in the ${drawMonth} draw!</p>
        <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
          <p style="color:#a3a3a3;margin:0;font-size:14px">Your Prize</p>
          <p style="color:#22c55e;font-size:48px;font-weight:bold;margin:8px 0">₹${prizeAmount.toFixed(2)}</p>
        </div>
        <p style="color:#a3a3a3">Log in to your dashboard to upload your proof and claim your prize.</p>
      </div>
    `
  })
};

const sendEmail = async ({ email, template, data, subject, html }) => {
  let emailContent;

  if (template && templates[template]) {
    emailContent = templates[template](data);
  } else {
    emailContent = { subject, html };
  }

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: emailContent.subject,
    html: emailContent.html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
