export interface GAccount {
  username: string;
  token: string;
  repo_owner: string;
  server_repo_name: string;
  stream_repo_name: string;
  workflows_json: string;
  fictional_name: string;
  server_slots_used: number;
  server_slots_max: number;
  stream_slots_used: number;
  stream_slots_max: number;
  total_slots_used: number;
  total_slots_max: number;
  boot_completed: boolean;
  last_active: number;
}

export interface RegisterRequest {
  ghp_token: string;
}

export interface RegisterResponse {
  success: boolean;
  username: string;
  server_repo: string;
  stream_repo: string;
}

export interface BootRequest {
  username: string;
}

export interface BootResponse {
  success: boolean;
  boot_completed: boolean;
  message: string;
}
