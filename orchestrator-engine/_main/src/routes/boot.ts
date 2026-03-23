import { Hono } from 'hono';
import { DBClient } from '../lib/db';
import { GitHubClient } from '../lib/github';
import { bootService } from '../services/boot';

type Env = {
  DB: D1Database;
  ZIP_STORAGE: R2Bucket;
};

export const bootRoute = new Hono<{ Bindings: Env }>();

bootRoute.post('/boot', async (c) => {
  try {
    const { username, ghp_token } = await c.req.json();

    if (!username || !ghp_token) {
      return c.json({ error: 'Missing username or ghp_token' }, 400);
    }

    const db = new DBClient(c.env.DB);
    const github = new GitHubClient(ghp_token);
    const result = await bootService(db, github, c.env.ZIP_STORAGE, username);

    return c.json(result);
  } catch (error: any) {
    console.error('Boot error:', error);
    return c.json({ error: error.message }, 500);
  }
});
