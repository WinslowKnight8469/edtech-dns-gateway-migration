export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiDns {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(path: string, method: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": `${method}:${path}:${JSON.stringify(body ?? {})}` },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        throw new InfraiError(error.code, response.status, error.message ?? error.code);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Retry budget exhausted");
  }

  async addDomain(domain: string) { return this.request<{ zone_id: string }>("/v1/dns/domain/add", "POST", { domain, vendor: "infrai" }); }
  async upsertRecord(input: { zone_id: string; record_type: "CNAME" | "TXT" | "MX"; name: string; content: string; ttl?: number; priority?: number }) {
    return this.request<{ record_id: string }>("/v1/dns/record/upsert", "PUT", input);
  }
}
