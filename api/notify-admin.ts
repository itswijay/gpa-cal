import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { message } = req.body || {}
  if (!message) {
    return res.status(400).json({ error: 'Missing message' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in environment variables.')
    return res.status(200).json({ success: false, info: 'Notification credentials not configured.' })
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Telegram API error: ${response.status} - ${errText}`)
      return res.status(500).json({ error: `Telegram request failed with status ${response.status}` })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
