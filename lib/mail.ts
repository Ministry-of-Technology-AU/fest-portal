import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { SHATRANJ_BANNER_JPEG, SHATRANJ_CAMPUS_JPEG } from '@/lib/email-images'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Reuse connections to avoid Gmail flagging frequent new connections
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FEST_NAME = 'Shatranj 2026'

// The template's images, referenced from it as cid:shatranj-banner and cid:shatranj-campus
const TEMPLATE_IMAGES: Mail.Attachment[] = [
  { filename: 'shatranj-2026.jpg', content: Buffer.from(SHATRANJ_BANNER_JPEG, 'base64'), contentType: 'image/jpeg', cid: 'shatranj-banner' },
  { filename: 'ashoka-campus.jpg', content: Buffer.from(SHATRANJ_CAMPUS_JPEG, 'base64'), contentType: 'image/jpeg', cid: 'shatranj-campus' },
]

export async function sendEmail(receiver: string, subject: string, body: string, html?: string, attachments?: Mail.Attachment[]) {
  try {
    const info = await transporter.sendMail({
      from: `"${FEST_NAME}" <${process.env.SMTP_USER}>`,
      to: receiver,
      subject,
      text: body,
      html: html || undefined,
      attachments,
    })

    console.log('Email sent successfully:', info.messageId)
    return { success: true, response: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

const HTML_TEMPLATE = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Shatranj 2026 - The ENT Weekender</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

    @media screen and (max-width: 600px) {
      .responsive-table { width: 100% !important; }
      .content-padding { padding: 28px 20px 10px 20px !important; }
      .id-padding { padding: 20px 15px !important; }
      .id-value { font-size: 24px !important; letter-spacing: 2px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Outer Background Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0a0a0a" style="background-color: #0a0a0a; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 20px 10px 30px 10px;">

        <!-- Main Email Container (600px Max) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" bgcolor="#000000" style="max-width: 600px; background-color: #000000; border: 1px solid #262626; border-radius: 12px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #d4d4d8;">

          <!-- ===== Banner image (900 x 300, shown at 600 x 200; padded so the title is not cramped) ===== -->
          <tr>
            <td bgcolor="#000000" style="background-color: #000000; padding: 18px 0 6px 0; font-size: 0; line-height: 0;">
              <img src="cid:shatranj-banner" width="600" alt="SHATRANJ 2026 - The ENT Weekender | 31st Oct &amp; 1st November" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; color: #f5b80f; font-family: Impact, 'Arial Black', sans-serif; font-size: 22px; line-height: 1.4; text-align: center;" />
            </td>
          </tr>
          <!-- Accent strip -->
          <tr>
            <td bgcolor="#f5b80f" style="background-color: #f5b80f; height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content-padding" style="padding: 36px 34px 10px 34px;">

              <!-- Header Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 25px;">
                    <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">{{TITLE}}</h1>
                    <p style="margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.5;">{{SUBTITLE}}</p>
                  </td>
                </tr>
              </table>

              <!-- Unique ID Container Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0 28px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#121212" style="background-color: #121212; border: 1px solid #3a3320; border-radius: 12px;">
                      <tr>
                        <td class="id-padding" align="center" style="padding: 26px 20px;">
                          <span style="display: block; color: #f5b80f; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">Your Auto-Generated User ID</span>

                          <!-- Dashed ID Box -->
                          <table border="0" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color: #000000; border: 2px dashed #f5b80f; border-radius: 8px;">
                            <tr>
                              <td align="center" style="padding: 12px 30px;">
                                <span class="id-value" style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 3px;">{{UNIQUE_ID}}</span>
                              </td>
                            </tr>
                          </table>

                          <span style="display: block; color: #8a8a93; font-size: 13px; margin-top: 14px;">Please keep this ID for your records and show it at the campus entry.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Message Body -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 15px; line-height: 1.65; color: #d4d4d8;">
                    <p style="margin: 0 0 16px 0;">Hi <strong style="color: #ffffff;">{{USER_NAME}}</strong>,</p>
                    <div style="margin: 0 0 20px 0; line-height: 1.65; color: #d4d4d8;">
                      {{MESSAGE}}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Event Meta Details -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #2a2a2a; margin-top: 20px;">
                <tr>
                  <td style="padding-top: 20px; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                    <p style="margin: 0 0 6px 0;"><strong style="color: #f5b80f;">Event Location:</strong> Ashoka University Campus</p>
                    <p style="margin: 0;"><strong style="color: #f5b80f;">Dates:</strong> October 31 &ndash; November 1, 2026</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ===== Ashoka buildings graphic (fades in from the card background) ===== -->
          <tr>
            <td bgcolor="#000000" style="background-color: #000000; padding: 0; font-size: 0; line-height: 0;">
              <img src="cid:shatranj-campus" width="600" alt="" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
            </td>
          </tr>

        </table>

        <!-- Footer Notice -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 20px 10px; font-size: 12px; color: #6b6b73; line-height: 1.4;">
              &copy; 2026 Fest Organizing Committee. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface TemplateFields {
  title: string
  /** HTML */
  subtitle: string
  userId: string
  userName: string
  /** HTML */
  message: string
}

/** Fills the template. Name and ID come from the registration form, so they're escaped. */
function renderTemplate(fields: TemplateFields) {
  const values: Record<string, string> = {
    '{{TITLE}}': escapeHtml(fields.title),
    '{{SUBTITLE}}': fields.subtitle,
    '{{UNIQUE_ID}}': escapeHtml(fields.userId),
    '{{USER_NAME}}': escapeHtml(fields.userName),
    '{{MESSAGE}}': fields.message,
  }
  // A replacer function, so "$" in a name isn't read as a replacement pattern
  return HTML_TEMPLATE.replace(/\{\{[A-Z_]+\}\}/g, (placeholder) => values[placeholder] ?? placeholder)
}

export function renderUserCreatedEmail(name: string, userId: string) {
  const subject = `Welcome to ${FEST_NAME} — Your Registration ID`
  const body = `Hi ${name},\n\nYou're registered for ${FEST_NAME} — The ENT Weekender, October 31 – November 1 at Ashoka University.\n\nYour User ID: ${userId}\n\nThis is mandatory for entry — please save it and show it at the campus entry.\n\nSee you at the fest!\nTeam Shatranj`

  const html = renderTemplate({
    title: 'Registration Confirmed!',
    subtitle: `You're in for <b>${FEST_NAME}</b> — The ENT Weekender!`,
    userId,
    userName: name,
    message: `Your User ID above is <b>mandatory for entry</b>, so please keep this email handy and show the ID at the campus entry.<br><br>Can't wait to host you. See you soon!<br><br><b>Warm regards,<br>Team Shatranj</b>`,
  })

  return { subject, body, html }
}

export function renderUserUpdatedEmail(name: string, userId: string) {
  const subject = `${FEST_NAME} — Your Information Has Been Updated`
  const body = `Hi ${name},\n\nYour registration information for ${FEST_NAME} has been updated.\n\nYour User ID: ${userId}\n\nIf you did not request this change, please contact the fest organizers.\n\nSee you at the fest!\nTeam Shatranj`

  const html = renderTemplate({
    title: 'Information Updated!',
    subtitle: `Your records for <b>${FEST_NAME}</b> have been updated.`,
    userId,
    userName: name,
    message: `Your registration information has been successfully updated. If you did not request this change, please contact the fest organizers immediately.<br><br><b>Warm regards,<br>Team Shatranj</b>`,
  })

  return { subject, body, html }
}

export async function sendUserCreatedEmail(email: string, name: string, userId: string, festName: string) {
  const { subject, body, html } = renderUserCreatedEmail(name, userId)
  return sendEmail(email, subject, body, html, TEMPLATE_IMAGES)
}

export async function sendUserUpdatedEmail(email: string, name: string, userId: string, festName: string) {
  const { subject, body, html } = renderUserUpdatedEmail(name, userId)
  return sendEmail(email, subject, body, html, TEMPLATE_IMAGES)
}
