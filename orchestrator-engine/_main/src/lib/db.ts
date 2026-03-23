import type { GAccount } from '../types';

export class DBClient {
  constructor(private db: D1Database) {}

  async getAccount(username: string): Promise<GAccount | null> {
    const result = await this.db
      .prepare('SELECT * FROM gaccounts WHERE username = ?')
      .bind(username)
      .first<GAccount>();

    return result || null;
  }

  async createAccount(account: GAccount): Promise<void> {
    await this.db.prepare(`
      INSERT INTO gaccounts (
        username, token, repo_owner, server_repo_name, stream_repo_name,
        workflows_json, fictional_name, server_slots_used, server_slots_max,
        stream_slots_used, stream_slots_max, total_slots_used, total_slots_max,
        boot_completed, last_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      account.username, account.token, account.repo_owner,
      account.server_repo_name, account.stream_repo_name,
      account.workflows_json, account.fictional_name,
      account.server_slots_used, account.server_slots_max,
      account.stream_slots_used, account.stream_slots_max,
      account.total_slots_used, account.total_slots_max,
      account.boot_completed ? 1 : 0, account.last_active
    ).run();
  }

  async updateServerSlots(username: string, slots_used: number): Promise<void> {
    await this.db.prepare(`
      UPDATE gaccounts
      SET server_slots_used = ?, total_slots_used = server_slots_used + stream_slots_used, last_active = ?
      WHERE username = ?
    `).bind(slots_used, Date.now(), username).run();
  }

  async updateStreamSlots(username: string, slots_used: number): Promise<void> {
    await this.db.prepare(`
      UPDATE gaccounts
      SET stream_slots_used = ?, total_slots_used = server_slots_used + stream_slots_used, last_active = ?
      WHERE username = ?
    `).bind(slots_used, Date.now(), username).run();
  }

  async getAllAccounts(): Promise<GAccount[]> {
    const result = await this.db
      .prepare('SELECT * FROM gaccounts')
      .all<GAccount>();

    return result.results;
  }

  async setBootCompleted(username: string, completed: boolean): Promise<void> {
    await this.db.prepare(`
      UPDATE gaccounts
      SET boot_completed = ?
      WHERE username = ?
    `).bind(completed ? 1 : 0, username).run();
  }
}
