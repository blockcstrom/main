import { Hono } from 'hono';
import { DBClient } from '../lib/db';

type Env = {
  DB: D1Database;
};

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get('/health', async (c) => {
  try {
    const db = new DBClient(c.env.DB);
    const accounts = await db.getAllAccounts();

    return c.json({
      status: 'healthy',
      active_tunnel: 'Galio',
      accounts_count: accounts.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return c.json({ status: 'unhealthy', error: error.message }, 500);
  }
});
