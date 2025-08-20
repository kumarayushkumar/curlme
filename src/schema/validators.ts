import { z } from 'zod'

export const deviceCodeSchema = z.object({
  device_code: z.string().optional()
})

