/**
 * Contact-page submissions.
 *
 * The site is a static SPA, so the form posts straight to a form endpoint
 * (Formspree, Web3Forms, Getform, or any URL that accepts a JSON POST). Set it
 * in `.env.local` / the Vercel project:
 *
 *   VITE_CONTACT_FORM_ENDPOINT=https://formspree.io/f/xxxxxxxx
 *
 * Keeping it in the environment means the inbox can change without a code
 * edit, and no secret ever ships in the bundle.
 */
export interface ContactMessage {
  name: string
  email: string
  topic: string
  message: string
}

const endpoint = (import.meta.env.VITE_CONTACT_FORM_ENDPOINT ?? '').trim()

/** True when a form endpoint has been configured for this build. */
export const isContactFormConfigured = endpoint.length > 0

export async function submitContactMessage(
  payload: ContactMessage,
): Promise<void> {
  if (!isContactFormConfigured) {
    throw new Error(
      'The contact form is not configured yet (VITE_CONTACT_FORM_ENDPOINT).',
    )
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Form endpoints answer with JSON instead of a redirect when asked.
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      topic: payload.topic,
      message: payload.message.trim(),
      // Formspree reads `_subject`; other endpoints simply ignore it.
      _subject: `[${payload.topic}] Website enquiry from ${payload.name.trim()}`,
    }),
  })

  if (response.ok) return

  // Form endpoints usually explain the failure in the JSON body.
  let detail = ''
  try {
    const data = (await response.json()) as { error?: string; message?: string }
    detail = data.error ?? data.message ?? ''
  } catch {
    // Non-JSON error body: fall through to the status text.
  }

  throw new Error(
    detail || `Could not send your message (${response.status}).`,
  )
}