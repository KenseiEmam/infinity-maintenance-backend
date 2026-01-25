const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid')

const transporter = nodemailer.createTransport(
  sgTransport({
    apiKey: process.env.SENDGRID_API_KEY,
  })
)

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string
  subject: string
  text?: string
  html?: string
  replyTo?: string
}) {
  return transporter.sendMail({
    from: {
      email: 'kuwait@infinitymedicalkwt.com',
      name: 'Infinity Medical Kuwait',
    },
    to,
    subject,
    text,
    html,
    replyTo,
  })
}
