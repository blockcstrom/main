import type { DBClient } from '../lib/db';
import type { GitHubClient } from '../lib/github';

export async function bootService(
  db: DBClient,
  github: GitHubClient,
  zipStorage: R2Bucket,
  username: string
): Promise<{ success: boolean; boot_completed: boolean; message: string }> {
  const account = await db.getAccount(username);

  if (!account) {
    throw new Error('Account not found');
  }

  if (account.boot_completed) {
    return {
      success: true,
      boot_completed: true,
      message: 'Boot already completed',
    };
  }

  const serverZIP = await zipStorage.get('server.zip');
  const streamZIP = await zipStorage.get('stream.zip');

  if (!serverZIP || !streamZIP) {
    throw new Error('ZIP files not found in R2');
  }

  await uploadWorkflows(github, username, account.server_repo_name, account.stream_repo_name);

  await db.setBootCompleted(username, true);

  return {
    success: true,
    boot_completed: true,
    message: 'Boot process completed',
  };
}

async function uploadWorkflows(
  github: GitHubClient,
  owner: string,
  serverRepo: string,
  streamRepo: string
): Promise<void> {
  const serverWorkflow = `name: A-Server
on: workflow_dispatch
  inputs:
    tunnel_token:
      description: 'Tunnel token'
      required: true

jobs:
  tunnel:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Download cloudflared
        run: wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared && chmod +x cloudflared > /dev/null 2>&1

      - name: Run tunnel
        run: |
          ./cloudflared tunnel --token \${{ github.event.inputs.tunnel_token }} > /dev/null 2>&1 &
          sleep 10

      - name: Keep alive
        run: while true; do sleep 60; done > /dev/null 2>&1
`;

  const streamWorkflow = `name: A-Stream
on: workflow_dispatch

jobs:
  stream:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Stream task
        run: while true; do sleep 60; done > /dev/null 2>&1
`;

  await github.uploadFile(owner, serverRepo, '.github/workflows/server.yml', serverWorkflow);
  await github.uploadFile(owner, streamRepo, '.github/workflows/stream.yml', streamWorkflow);
}
