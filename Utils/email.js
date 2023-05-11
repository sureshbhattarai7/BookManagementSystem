const nodemailer = require('nodemailer');

const sendMail = async options => {
    //Create a TRANSPORTER
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    //DEFINE THE EMAIL OPTIONS 
    const mailOptions = {
        from: 'bhattaraisuresh009@gmail.com',
        to: options.email,
        subject: options.subject,
        text: options.message
    };
    
    //ACTUALLY SEND THE EMAIL
    await transporter.sendMail(mailOptions)};

module.exports = sendMail;