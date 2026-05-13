import { z } from 'zod';

export const WebAppLaunchOptionsSchema = z.object({});

export const WebDriverBrowserConfigSchema = z.object({
  browserName: z.string().min(1, 'browserName is required'),
  url: z.string().url('A valid URL is required'),
  hostname: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  path: z.string().optional(),
  protocol: z.enum(['http', 'https']).optional(),
  capabilities: z.record(z.unknown()).optional(),
  showLogs: z.boolean().default(false),
});

export const WebDriverPlatformConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  browser: WebDriverBrowserConfigSchema,
  appLaunchOptions: WebAppLaunchOptionsSchema.optional(),
});

export type WebDriverBrowserConfig = z.infer<typeof WebDriverBrowserConfigSchema>;
export type WebDriverPlatformConfig = z.infer<typeof WebDriverPlatformConfigSchema>;
