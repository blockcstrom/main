import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerRoute } from './routes/register';
import { healthRoute } from './routes/health';
import { bootRoute } from './routes/boot';
import { cronRoute } from './routes/cron';

type Env = {
  DB: D1Database;
  ZIP_STORAGE: R2Bucket;
  ENVIRONMENT: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ZONE_ID: string;
  DNS_RECORD_ID: string;
  GALIO_TUNNEL_ID: string;
  BORIO_TUNNEL_ID: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.route('/', registerRoute);
app.route('/', healthRoute);
app.route('/', bootRoute);
app.route('/', cronRoute);

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
