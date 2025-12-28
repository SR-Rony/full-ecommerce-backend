import nodemailer from 'nodemailer';
import { ContactUsMailSender, OtpMailSender, PasswordChangeMailSender, PasswordResetMailSender, SendContactUsMailAdmin, customerOrderReviewAndSendMailToAdmin, sendNewOrderMail, sendOrderCommentSendMailToCustomer, sendOrderPackedMail, sendOrderShippedMail, sendPaidLessAmountMail, sendPaymentFailedMail } from './auctropinEmailHelpers.js';

export const AuctropinContactMailSender = async (data) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // HTML template
        const emailTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
                <style>
                    /* Include your styles here */
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Hello, ${data.name}!</h1>
                    <p>This is a sample email template. Customize this section with your own content.</p>

                    <div style="margin-top: 20px;">
                        <p>Thank you for your interest and support!</p>
                        <p>If you have any questions, feel free to contact us at ${process.env.ADMIN_EMAIL}.</p>
                    </div>

                    <div style="margin-top: 20px;">
                        <p>Best regards,</p>
                        <p>Your Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Define email options
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: data.email,
            subject: 'Sample Email',
            html: emailTemplate,
        };

        // Wrap sendMail in a Promise
        const sendMailPromise = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            });
        };

        // Use async/await to wait for the Promise to resolve
        const result = await sendMailPromise();
        console.log('Email sent:', result);
        return true;
    } catch (error) {
        console.error(error.message);
        return false;
    }
};


export const EmailOrderPlaceMailSender = async (data) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // HTML template
        const emailTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
                <style>
                    /* Include your styles here */
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Thank you placing the order!</h1>
                    <p>your orderId is ${data?.orderId}</p>
                    <p>your order tracking number is ${data?.tracking?.number}</p>
                    <div style="margin-top: 20px;">
                        <p>Thank you for your interest and support!</p>
                        <p>If you have any questions, feel free to contact us at ${process.env.ADMIN_EMAIL}.</p>
                    </div>

                    <div style="margin-top: 20px;">
                        <p>Best regards,</p>
                        <p>Your Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Define email options
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: data.email,
            subject: 'Sample Email',
            html: emailTemplate,
        };

        // Wrap sendMail in a Promise
        const sendMailPromise = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            });
        };

        // Use async/await to wait for the Promise to resolve
        const result = await sendMailPromise();
        console.log('Email sent:', result);
        return true;
    } catch (error) {
        console.error(error.message);
        return false;
    }
};


export const AuctropinCustomerMailController ={
    auth:{
        PasswordResetMailSender,
        OtpMailSender,
        PasswordChangeMailSender
    },
    contact:{
        ContactUsMailSender,
        SendContactUsMailAdmin
    },
    order:{
        sendNewOrderMail,
        sendOrderPackedMail,
        sendOrderShippedMail,
        sendOrderCommentSendMailToCustomer,
        sendPaidLessAmountMail,
        customerOrderReviewAndSendMailToAdmin,
        sendPaymentFailedMail
    },
    
}
