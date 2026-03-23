import type { GAccount } from '../types';
import type { DBClient } from '../lib/db';
import type { GitHubClient } from '../lib/github';
import { generateAllNames } from '../lib/names';

export async function registrationService(
  db: DBClient,
  github: GitHubClient,
  token: string
): Promise<{ success: boolean; username: string; server_repo: string; stream_repo: string }> {
  const username = await github.getUsername();

  await github.deleteAllRepositories();

  const names = generateAllNames();
  const serverRepo = `${names.repo}-${names.yml}`;
  const streamRepo = `${names.repo}-${names.yml}`;

  await github.createRepository(serverRepo, 'private');
  await github.createRepository(streamRepo, 'private');

  const workflowYML = `name: CI
on: workflow_dispatch
jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - run: echo "Hello World" > /dev/null 2>&1`;

  await github.uploadFile(username, serverRepo, '.github/workflows/ci.yml', workflowYML);
  await github.uploadFile(username, streamRepo, '.github/workflows/ci.yml', workflowYML);

  const account: GAccount = {
    username,
    token,
    repo_owner: username,
    server_repo_name: serverRepo,
    stream_repo_name: streamRepo,
    workflows_json: JSON.stringify(['ci.yml']),
    fictional_name: `${username}-${Date.now()}`,
    server_slots_used: 0,
    server_slots_max: 1,
    stream_slots_used: 0,
    stream_slots_max: 19,
    total_slots_used: 0,
    total_slots_max: 20,
    boot_completed: false,
    last_active: Date.now(),
  };

  await db.createAccount(account);

  return {
    success: true,
    username,
    server_repo: serverRepo,
    stream_repo: streamRepo,
  };
}
