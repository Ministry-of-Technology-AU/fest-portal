import nodemailer from 'nodemailer'
import path from 'path'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Reuse connections to avoid Gmail flagging frequent new connections
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Define the static attachments
const ATTACHMENTS = [
  {
    filename: 'Banjaara 2026 Rules and Regulations (External Participants_Attendees).pdf',
    path: path.join(process.cwd(), 'public', 'Banjaara 2026_ Rules and Regulations (External Participants_Attendees).pdf')
  },
  {
    filename: 'Shuttle Schedule 11th April Banjaara7.0.pdf',
    path: path.join(process.cwd(), 'public', 'Shuttle Schedule_11th April_Banjaara7.0 - Google Docs 2.pdf')
  }
]

export async function sendEmail(receiver: string, subject: string, body: string, html?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Banjaara 2026" <${process.env.SMTP_USER}>`,
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
  const subject = `Welcome to Banjaara 7.0 — Your Registration ID`
  const body = `Hi ${name},\n\nYou're registered for Banjaara 7.0!\n\nYour User ID: ${userId}\n\nThis is mandatory for entry — please save it carefully.\n\nSee you at the fest!\nTeam Banjaara`

  const html = HTML_TEMPLATE
    .replace('{{TITLE}}', 'Registration Confirmed!')
    .replace('{{SUBTITLE}}', "You're in for <b>Banjaara 7.0</b> — Ashoka University's biggest cultural fest!")
    .replace('{{UNIQUE_ID}}', userId)
    .replace('{{USER_NAME}}', name)
    .replace('{{MESSAGE}}', `Get ready for 25+ competitions and headliners like <b>Pranav Sharma</b> and <b>Nikhil D'Souza</b>.<br><br>A few things to keep in mind:<br><ul style="padding-left:20px;line-height:1.8;"><li>Please carry <b>physical copies</b> of both your <b>government ID</b> and <b>college ID</b> — soft copies will not be accepted.</li><li>A policy document with shuttle services and on-campus guidelines is attached — please read it carefully.</li><li>Shuttle services from Azadpur to Ashoka run on a first-come, first-served basis. Schedule attached below.</li></ul>Can't wait to host you. See you soon! ✨<br><br><b>Warm regards,<br>Team Banjaara</b>`)

  return sendEmail(email, subject, body, html)
}

export async function sendUserUpdatedEmail(email: string, name: string, userId: string, festName: string) {
  const subject = `Banjaara 7.0 — Your Information Has Been Updated`
  const body = `Hi ${name},\n\nYour registration information for Banjaara 7.0 has been updated.\n\nYour User ID: ${userId}\n\nIf you did not request this change, please contact the fest organizers.\n\nSee you at the fest!`

  const html = HTML_TEMPLATE
    .replace('{{TITLE}}', 'Information Updated!')
    .replace('{{SUBTITLE}}', 'Your records for <b>Banjaara 7.0</b> have been updated.')
    .replace('{{UNIQUE_ID}}', userId)
    .replace('{{USER_NAME}}', name)
    .replace('{{MESSAGE}}', 'Your registration information has been successfully updated. If you did not request this change, please contact the fest organizers immediately. <b>PFA the transport schedule and the general guidelines for Banjaara 7.0</b>')

  // Return the promise
  return sendEmail(email, subject, body, html)
}



