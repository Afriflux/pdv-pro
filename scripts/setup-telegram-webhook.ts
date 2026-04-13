import * as dotenv from 'dotenv';

// Load environment variables from .env.local if present
dotenv.config({ path: '.env.local' });
// Fallback to .env
dotenv.config();

function logSuccess(message: string) {
  console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
}

function logError(message: string) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (!token) {
    logError('Missing TELEGRAM_BOT_TOKEN in environment variables.');
    process.exit(1);
  }

  if (!secret) {
    logError('Missing TELEGRAM_WEBHOOK_SECRET in environment variables.');
    process.exit(1);
  }

  if (!appUrl) {
    logError('Missing NEXT_PUBLIC_APP_URL or APP_URL in environment variables.');
    process.exit(1);
  }

  if (appUrl.includes('localhost')) {
    console.warn(`\x1b[33m[WARNING]\x1b[0m Webhooks cannot be tested reliably on localhost without a tunnel (like ngrok).`);
  }

  const webhookUrl = `${appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl}/api/telegram/webhook`;

  console.log(`Setting Telegram webhook for bot...`);
  console.log(`Target URL: ${webhookUrl}`);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message", "callback_query", "chat_member", "chat_join_request"],
        drop_pending_updates: false,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      logError(`Failed to set Telegram webhook: ${data.description || response.statusText}`);
      process.exit(1);
    }

    logSuccess(`Webhook successfully configured!`);
  } catch (error) {
    logError(`Network error configuring webhook: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
