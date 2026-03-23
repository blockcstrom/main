import { Hono } from 'hono';
import { DBClient } from '../lib/db';
import { CloudflareClient } from '../lib/cloudflare';
import { GitHubClient } from '../lib/github';
import { orchestrationService } from '../services/orchestration';

type Env = {
  DB: D1Database;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ZONE_ID: string;
  DNS_RECORD_ID: string;
  GALIO_TUNNEL_ID: string;
  BORIO_TUNNEL_ID: string;
  GALIO_TOKEN: string;
  BORIO_TOKEN: string;
};

export const cronRoute = new Hono<{ Bindings: Env }>();

cronRoute.get('/cron', async (c) => {
  try {
    const db = new DBClient(c.env.DB);
    const cloudflare = new CloudflareClient(
      c.env.CLOUDFLARE_API_TOKEN,
      c.env.CLOUDFLARE_ZONE_ID,
      c.env.DNS_RECORD_ID,
      c.env.GALIO_TUNNEL_ID,
      c.env.BORIO_TUNNEL_ID
    );

    const accounts = await db.getAllAccounts();

    let totalActionsTriggered = 0;

    for (const account of accounts) {
      const github = new GitHubClient(account.token);
      const galioToken = c.env.GALIO_TOKEN;
      const borioToken = c.env.BORIO_TOKEN;

      try {
        const result = await orchestrationService(
          db,
          cloudflare,
          github,
          galioToken,
          borioToken
        );
        totalActionsTriggered += result.actionsTriggered;
      } catch (e) {
        console.error(`Orchestration failed for ${account.username}:`, e);
      }
    }

    return c.json({
      success: true,
      accounts_processed: accounts.length,
      actions_triggered: totalActionsTriggered,
    });
  } catch (error: any) {
    console.error('Cron error:', error);
    return c.json({ error: error.message }, 500);
  }
});
