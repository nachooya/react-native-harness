import { z } from 'zod';

export const WebPlatformConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  browserName: z.string().min(1, 'browserName is required'),
  appUrl: z.string().url('appUrl must be a valid URL').default('http://localhost:8081'),
});

export type WebPlatformConfig = z.infer<typeof WebPlatformConfigSchema>;
