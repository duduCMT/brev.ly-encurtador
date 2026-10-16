import { z } from 'zod';

export const createShortLinkSchema = z.object({
  originalUrl: z.string().trim().min(1).max(2048),
  shortUrl: z.string().min(1).max(128),
});

export type CreateShortLinkValues = z.infer<typeof createShortLinkSchema>;
