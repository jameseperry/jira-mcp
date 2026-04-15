class JiraInstance {
  private baseUrl: string;
  private authHeader: string;

  constructor(baseUrl: string, email: string, apiToken: string) {
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

export class JiraClient {
  private instances = new Map<string, JiraInstance>();
  private email: string;
  private apiToken: string;
  private defaultBaseUrl: string;

  constructor() {
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!baseUrl || !email || !apiToken) {
      throw new Error(
        "Missing required environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
      );
    }

    this.defaultBaseUrl = baseUrl;
    this.email = email;
    this.apiToken = apiToken;
  }

  /** Resolve an instance name to a JiraInstance, creating and caching as needed. */
  for(instance?: string): JiraInstance {
    const key = instance || "_default";
    let inst = this.instances.get(key);
    if (!inst) {
      let baseUrl: string;
      if (!instance) {
        baseUrl = this.defaultBaseUrl;
      } else {
        const envUrl = process.env[`JIRA_BASE_URL_${instance}`];
        if (!envUrl) {
          throw new Error(
            `Unknown Jira instance "${instance}". Set JIRA_BASE_URL_${instance} environment variable.`
          );
        }
        baseUrl = envUrl;
      }
      inst = new JiraInstance(baseUrl, this.email, this.apiToken);
      this.instances.set(key, inst);
    }
    return inst;
  }

  // Convenience shortcuts for default instance (used internally)
  get(path: string) { return this.for().get(path); }
  post(path: string, body: unknown) { return this.for().post(path, body); }
  put(path: string, body: unknown) { return this.for().put(path, body); }
  delete(path: string) { return this.for().delete(path); }
  agileGet(path: string) { return this.for().agileGet(path); }
  agilePost(path: string, body: unknown) { return this.for().agilePost(path, body); }
  agilePut(path: string, body: unknown) { return this.for().agilePut(path, body); }
}
