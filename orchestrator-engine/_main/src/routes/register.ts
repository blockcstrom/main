import { Hono } from 'hono';
import { DBClient } from '../lib/db';
import { GitHubClient } from '../lib/github';
import { registrationService } from '../services/registration';

type Env = {
  DB: D1Database;
};

export const registerRoute = new Hono<{ Bindings: Env }>();

registerRoute.post('/register', async (c) => {
  try {
    const { ghp_token } = await c.req.json();

    if (!ghp_token) {
      return c.json({ error: 'Missing ghp_token' }, 400);
    }

    const db = new DBClient(c.env.DB);
    const github = new GitHubClient(ghp_token);

    const result = await registrationService(db, github, ghp_token);

    return c.json(result);
  } catch (error: any) {
    console.error('Register error:', error);
    return c.json({ error: error.message }, 500);
  }
});
