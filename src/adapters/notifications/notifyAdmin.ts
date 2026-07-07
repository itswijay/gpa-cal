/**
 * Notify administrators of actions (e.g. new curriculum suggestion, deletion request).
 * This function is fire-and-forget and safe: all errors are caught and swallowed,
 * ensuring failure never disrupts the user workflow.
 */
export async function notifyAdmin(message: string): Promise<void> {
  try {
    const response = await fetch('/api/notify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      console.warn(`Admin notification endpoint returned non-OK status: ${response.status}`)
    }
  } catch (error) {
    console.warn('Failed to send admin notification:', error)
  }
}
