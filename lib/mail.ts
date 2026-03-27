import nodemailer from 'nodemailer'
import path from 'path'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
})

// Define the static attachments
const ATTACHMENTS = [
    {
        filename: 'General Guidelines + Security Protocols.pdf',
        path: path.join(process.cwd(), 'public', 'EXTERNALS -  General Guidelines + Security Protocols.pdf')
    },
    {
        filename: 'Transport schedule - EQ 4.0.pdf',
        path: path.join(process.cwd(), 'public', 'Transport schedule - EQ 4.0.pdf')
    }
]

export async function sendEmail(receiver: string, subject: string, body: string, html?: string) {
    try {
        const info = await transporter.sendMail({
            from: `"Equilibrium 4.0" <${process.env.SMTP_USER}>`,
            to: receiver,
            subject,
            text: body,
            html: html || undefined,
            attachments: ATTACHMENTS,
        })

        console.log('Email sent successfully:', info.messageId)
        return { success: true, response: info.messageId }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { success: false, error }
    }
}


const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f9fafb;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f9fafb;
      padding-bottom: 40px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      color: #374151;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 20px;
      border: 1px solid #e5e7eb;
    }
    .content {
      padding: 40px 30px;
    }
    .header-text {
      text-align: center;
      margin-bottom: 30px;
    }
    .id-container {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
    }
    .id-label {
      color: #0369a1;
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 15px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .id-box {
      display: inline-block;
      background-color: #ffffff;
      border: 2px dashed #0ea5e9;
      border-radius: 8px;
      padding: 15px 40px;
      margin: 10px 0;
    }
    .id-value {
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: bold;
      color: #1e293b;
      letter-spacing: 4px;
    }
    .id-footer {
      color: #64748b;
      font-size: 13px;
      margin-top: 15px;
      display: block;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%">
      <tr>
        <td class="content">
          <div class="header-text">
            <h1 style="color: #111827; margin: 0;">{{TITLE}}</h1>
            <p style="color: #4b5563;">{{SUBTITLE}}</p>
          </div>

          <div class="id-container">
            <span class="id-label">Your Auto-Generated User ID:</span>
            <div class="id-box">
              <span class="id-value">{{UNIQUE_ID}}</span>
            </div>
            <span class="id-footer">Please keep this ID for your records and future reference.</span>
          </div>

          <p style="line-height: 1.6;">Hi <strong>{{USER_NAME}}</strong>,</p>
          <p style="line-height: 1.6;">{{MESSAGE}}</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;"><strong>Event Location:</strong> Ashoka University Campus</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;"><strong>Date:</strong> March 27, 2026</p>
          </div>
        </td>
      </tr>
    </table>
    <div class="footer">
      &copy; 2026 Fest Organizing Committee. All rights reserved.
    </div>
  </div>
</body>
</html>
`

export async function sendUserCreatedEmail(email: string, name: string, userId: string, festName: string) {
    const subject = `Welcome to Equilibrium 4.0 — Your Registration ID`
    const body = `Hi ${name},\n\nYou have been successfully registered for Equilibrium 4.0!\n\nYour User ID: ${userId}\n\nPlease keep this ID safe — you will need it for gate entry and event registration.\n\nSee you at the fest!`

    const html = HTML_TEMPLATE
        .replace('{{TITLE}}', 'Registration Confirmed!')
        .replace('{{SUBTITLE}}', 'We are excited to have you at <b>Equilibrium 4.0</b>!')
        .replace('{{UNIQUE_ID}}', userId)
        .replace('{{USER_NAME}}', name)
        .replace('{{MESSAGE}}', 'Your registration for the event has been successfully processed. Please present the ID above at the check-in counter on the day of the event. <b>PFA the transport schedule and the general guidelines for Equilibrium 4.0.</b>')

    // Return the promise so it can be awaited if needed
    return sendEmail(email, subject, body, html)
}

export async function sendUserUpdatedEmail(email: string, name: string, userId: string, festName: string) {
    const subject = `Equilibrium 4.0 — Your Information Has Been Updated`
    const body = `Hi ${name},\n\nYour registration information for Equilibrium 4.0 has been updated.\n\nYour User ID: ${userId}\n\nIf you did not request this change, please contact the fest organizers.\n\nSee you at the fest!`

    const html = HTML_TEMPLATE
        .replace('{{TITLE}}', 'Information Updated!')
        .replace('{{SUBTITLE}}', 'Your records for <b>Equilibrium 4.0</b> have been updated.')
        .replace('{{UNIQUE_ID}}', userId)
        .replace('{{USER_NAME}}', name)
        .replace('{{MESSAGE}}', 'Your registration information has been successfully updated. If you did not request this change, please contact the fest organizers immediately. <b>PFA the transport schedule and the general guidelines for Equilibrium 4.0</b>')

    // Return the promise
    return sendEmail(email, subject, body, html)
}



