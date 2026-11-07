require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-leger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'welcome to backend-leger';
    const text = `hello ${name},\n\nThank you for registering at Backend-leger.\nWe're excited to have you on board!\n\nBest regards,\nThe backend-leger team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend-leger. We are excited to have you on board!</p><p>Best regards,<br>The backend-leger team</p>`;

    await sendEmail(userEmail, subject, text, html);
}
async function sendTransactionEmail(
    userEmail,
    name,
    amount,
    receiverName,
    receiverEmail,
    transactionId
) {
    const subject = "Transaction Notification";

    const text = `Hello ${name},

A transaction of amount ${amount} has been made to ${receiverName}.

Transaction ID: ${transactionId}

Best regards,
The backend-leger team`;

    const html = `
        <p>Hello ${name},</p>

        <p>
            A transaction of amount ${amount}
            has been made to ${receiverName}.
        </p>

        <p>Transaction ID: ${transactionId}</p>

        <p>
            Best regards,<br>
            The backend-leger team
        </p>
    `;

    await sendEmail(
        userEmail,
        subject,
        text,
        html
    );
}

  
  //this function will send email to user when transaction is made
  //html is used to send email in html format meaning we can use html tags in email body
  

//if transaction failed then we can send email to user that transaction failed
async function sendTransactionFailedEmail(userEmail,name,amount,toAccount){
  const subject = 'Transaction Failed Notification';
  const text = `Hello ${name},\n\nA transaction of amount ${amount} to account ${toAccount} has failed.\n\nBest regards,\nThe backend-leger team`;
  const html = `<p>Hello ${name},</p><p>A transaction of amount ${amount} to account ${toAccount} has failed.</p><p>Best regards,<br>The backend-leger team</p>`;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailedEmail
};