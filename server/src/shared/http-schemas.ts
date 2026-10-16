import { z } from 'zod';

export const messageSchema = z.object({
  message: z.string(),
  errors: z.optional(z.string()),
});

export const linkSchema = z.object({
  id: z.string(),
  originalUrl: z.string(),
  shortUrl: z.string(),
  clicks: z.number(),
  createdAt: z.date(),
});
