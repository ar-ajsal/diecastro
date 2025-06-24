const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,  // Your Gmail address
                pass: process.env.EMAIL_PASS   // Your Gmail app password
            }
        });

        const mailOptions = {
            from: `"Diecastro" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent to:", to);
    } catch (err) {
        console.error("❌ Failed to send email:", err);
    }
};

module.exports = sendEmail;
