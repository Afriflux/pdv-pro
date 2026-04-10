import { kv } from '@vercel/kv';

export async function getRateLimitStatus(ip: string, limit: number = 5, windowMs: number = 60000): Promise<{ success: boolean; error?: string }> {
  try {
    // Vercel KV check
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn('Vercel KV non configuré, le rate limiting est contourné.');
      return { success: true };
    }

    const key = `ratelimit:${ip}`;
    const windowSeconds = Math.floor(windowMs / 1000);

    const requests = await kv.incr(key);

    if (requests === 1) {
      await kv.expire(key, windowSeconds);
    }

    if (requests > limit) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // En cas de panne de Redis, on laisse passer la requête
    return { success: true, error: (error as Error).message };
  }
}
