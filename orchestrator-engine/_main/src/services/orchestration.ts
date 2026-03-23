import type { DBClient } from '../lib/db';
import { CloudflareClient } from '../lib/cloudflare';
import type { GitHubClient } from '../lib/github';

export async function orchestrationService(
  db: DBClient,
  cloudflare: CloudflareClient,
  github: GitHubClient,
  galioToken: string,
  borioToken: string
): Promise<{ success: boolean; message: string; activeTunnel: string; actionsTriggered: number }> {
  const accounts = await db.getAllAccounts();

  let serverSlotUsed = false;
  let streamSlotsUsed = 0;
  let actionsTriggered = 0;

  const activeTunnel = determineActiveTunnel();
  const tunnelToken = activeTunnel === 'Galio' ? galioToken : borioToken;
  const tunnelId = activeTunnel === 'Galio' ? cloudflare.getGalioTunnel() : cloudflare.getBorioTunnel();

  for (const account of accounts) {
    if (account.boot_completed) {
      if (!serverSlotUsed && account.server_slots_used < account.server_slots_max) {
        try {
          await github.triggerWorkflow(
            account.repo_owner,
            account.server_repo_name,
            'server.yml',
            { tunnel_token: tunnelToken }
          );
          actionsTriggered++;
        } catch (e) {
          console.error(`Failed to trigger A-Server for ${account.username}:`, e);
        }
        await db.updateServerSlots(account.username, account.server_slots_used + 1);
        serverSlotUsed = true;
      }

      if (streamSlotsUsed < 5) {
        try {
          await github.triggerWorkflow(
            account.repo_owner,
            account.stream_repo_name,
            'stream.yml',
            {}
          );
          actionsTriggered++;
        } catch (e) {
          console.error(`Failed to trigger A-Stream for ${account.username}:`, e);
        }
        await db.updateStreamSlots(account.username, account.stream_slots_used + 1);
        streamSlotsUsed++;
      }
    }
  }

  await cloudflare.updateDNS(tunnelId);

  return {
    success: true,
    message: 'Orchestration completed',
    activeTunnel,
    actionsTriggered,
  };
}

function determineActiveTunnel(): 'Galio' | 'Borio' {
  const now = Date.now();
  const rotationInterval = 340 * 60 * 1000;
  return now % (rotationInterval * 2) < rotationInterval ? 'Galio' : 'Borio';
}
