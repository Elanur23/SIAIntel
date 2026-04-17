import { z } from 'zod'

export const ContactEmailSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
  category: z.string().optional(),
})

export type ContactEmailData = z.infer<typeof ContactEmailSchema>

export async function sendContactEmail(data: ContactEmailData): Promise<{ success: boolean; error?: string; messageId?: string }> {
  console.log('[EMAIL] Contact:', data.name, data.category)
  return { success: true, messageId: 'mock-' + Date.now() }
}

export async function testEmailConfiguration() {
  return { configured: false }
}
