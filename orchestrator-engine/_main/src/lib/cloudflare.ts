export class CloudflareClient {
  constructor(
    private apiToken: string,
    private zoneId: string,
    private dnsRecordId: string,
    private galioTunnelId: string,
    private borioTunnelId: string
  ) {}

  private async api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4${path}`,
      {
        ...options,
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async updateDNS(target: string): Promise<void> {
    await this.api(`/zones/${this.zoneId}/dns_records/${this.dnsRecordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: target }),
    });
  }

  getGalioTunnel(): string {
    return this.galioTunnelId;
  }

  getBorioTunnel(): string {
    return this.borioTunnelId;
  }
}
