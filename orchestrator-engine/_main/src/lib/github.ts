interface GitHubUser {
  login: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
}

export class GitHubClient {
  constructor(private token: string) {}

  private async api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`https://api.github.com${url}`, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getUsername(): Promise<string> {
    const user = await this.api<GitHubUser>('/user');
    return user.login;
  }

  async listRepositories(): Promise<GitHubRepo[]> {
    let page = 1;
    let allRepos: GitHubRepo[] = [];

    while (true) {
      const repos = await this.api<GitHubRepo[]>(
        `/user/repos?per_page=100&page=${page}`
      );

      if (repos.length === 0) break;

      allRepos = allRepos.concat(repos);
      page++;
    }

    return allRepos;
  }

  async deleteAllRepositories(): Promise<void> {
    const repos = await this.listRepositories();
    await Promise.all(
      repos.map((repo) => this.deleteRepository(repo.full_name))
    );
  }

  private async deleteRepository(fullName: string): Promise<void> {
    await this.api(`/repos/${fullName}`, { method: 'DELETE' });
  }

  async createRepository(name: string, visibility: 'public' | 'private' = 'private'): Promise<void> {
    await this.api('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name, visibility }),
    });
  }

  async uploadFile(
    owner: string,
    repo: string,
    path: string,
    content: string
  ): Promise<void> {
    const base64 = btoa(content);
    const sha = await this.getFileSHA(owner, repo, path);

    const method = sha ? 'PUT' : 'POST';
    const url = `/repos/${owner}/${repo}/contents/${path}`;

    await this.api(url, {
      method,
      body: JSON.stringify({
        message: `Upload ${path}`,
        content: base64,
        sha,
      }),
    });
  }

  private async getFileSHA(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const result: any = await this.api(`/repos/${owner}/${repo}/contents/${path}`);
      return result.sha;
    } catch {
      return null;
    }
  }

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflow: string,
    inputs: Record<string, string>
  ): Promise<void> {
    await this.api(
      `/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({ inputs, ref: 'main' }),
      }
    );
  }
}
