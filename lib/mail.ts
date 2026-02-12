const API_URL = process.env.MAIL_API_URL!
const TOKEN = process.env.MAIL_API_TOKEN!

export async function sendEmail(receiver: string, subject: string, body: string) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiver,
                subject,
                body,
                auth_token: TOKEN,
            }),
        })

        const text = await response.text()
        console.log('Mail API response:', text)
        return { success: response.ok, response: text }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { success: false, error }
    }
}

export function sendUserCreatedEmail(email: string, name: string, userId: string, festName: string) {
    const subject = `Welcome to ${festName} — Your Registration ID`
    const body = `Hi ${name},\n\nYou have been successfully registered for ${festName}!\n\nYour User ID: ${userId}\n\nPlease keep this ID safe — you will need it for gate entry and event registration.\n\nSee you at the fest!`

    // Fire and forget — don't block the API response
    sendEmail(email, subject, body).catch(err =>
        console.error('Failed to send user created email:', err)
    )
}

export function sendUserUpdatedEmail(email: string, name: string, userId: string, festName: string) {
    const subject = `${festName} — Your Information Has Been Updated`
    const body = `Hi ${name},\n\nYour registration information for ${festName} has been updated.\n\nYour User ID: ${userId}\n\nIf you did not request this change, please contact the fest organizers.\n\nSee you at the fest!`

    // Fire and forget
    sendEmail(email, subject, body).catch(err =>
        console.error('Failed to send user updated email:', err)
    )
}
