export class JiraClient {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!baseUrl || !email || !apiToken) {
      throw new Error(
        "Missing required environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
      );
    }

    this.baseUrl = `${baseUrl.replace(/\/$/, "")}/rest`;
    this.authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
  }

  private async request(path: string, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Jira API error ${response.status}: ${body}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  // REST API v3
  get(path: string) {
    return this.request(`/api/3${path}`);
  }

  post(path: string, body: unknown) {
    return this.request(`/api/3${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(path: string, body: unknown) {
    return this.request(`/api/3${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete(path: string) {
    return this.request(`/api/3${path}`, { method: "DELETE" });
  }

  // Agile REST API
  agileGet(path: string) {
    return this.request(`/agile/1.0${path}`);
  }

  agilePost(path: string, body: unknown) {
    return this.request(`/agile/1.0${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  agilePut(path: string, body: unknown) {
    return this.request(`/agile/1.0${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}
