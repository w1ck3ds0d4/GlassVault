const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      // Store token for persistence across page reloads
      localStorage.setItem("cv_token", token);
    } else {
      localStorage.removeItem("cv_token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("cv_token");
    }
    return this.token;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const result = await this.request<{ data: T; errors?: any[] }>("/graphql", {
      method: "POST",
      body: { query, variables },
    });

    if (result.errors?.length) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  // Auth
  async login(email: string, password: string, tenantSlug: string) {
    const result = await this.request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: { email, password, tenantSlug },
    });
    this.setToken(result.token);
    return result;
  }

  logout() {
    this.setToken(null);
  }

  // Projects
  async getProjects(includePrivate = false) {
    return this.graphql<{ projects: any[] }>(
      `query($includePrivate: Boolean) {
        projects(includePrivate: $includePrivate) {
          id name description isPrivate tenantId createdAt documentCount
        }
      }`,
      { includePrivate }
    );
  }

  async getProject(id: string) {
    return this.graphql<{ project: any }>(
      `query($id: ID!) {
        project(id: $id) {
          id name description isPrivate tenantId createdAt
          documents { id title classification createdAt updatedAt }
          createdBy { id email displayName }
        }
      }`,
      { id }
    );
  }

  async createProject(name: string, description?: string, isPrivate?: boolean) {
    return this.graphql<{ createProject: any }>(
      `mutation($name: String!, $description: String, $isPrivate: Boolean) {
        createProject(name: $name, description: $description, isPrivate: $isPrivate) {
          id name description isPrivate
        }
      }`,
      { name, description, isPrivate }
    );
  }

  // Documents
  async getDocuments(projectId?: string, classification?: string) {
    return this.graphql<{ documents: any[] }>(
      `query($projectId: ID, $classification: String) {
        documents(projectId: $projectId, classification: $classification) {
          id title classification projectId tenantId createdAt updatedAt
        }
      }`,
      { projectId, classification }
    );
  }

  async getDocument(id: string) {
    return this.graphql<{ document: any }>(
      `query($id: ID!) {
        document(id: $id) {
          id title content classification projectId tenantId createdAt updatedAt
          createdBy { id email displayName }
          project { id name }
        }
      }`,
      { id }
    );
  }

  async createDocument(projectId: string, title: string, content?: string, classification?: string) {
    return this.graphql<{ createDocument: any }>(
      `mutation($projectId: ID!, $title: String!, $content: String, $classification: String) {
        createDocument(projectId: $projectId, title: $title, content: $content, classification: $classification) {
          id title classification
        }
      }`,
      { projectId, title, content, classification }
    );
  }

  async searchDocuments(query: string, page = 1, pageSize = 20) {
    return this.graphql<{ searchDocuments: any }>(
      `query($query: String!, $page: Int, $pageSize: Int) {
        searchDocuments(query: $query, page: $page, pageSize: $pageSize) {
          documents { id title classification projectId tenantId }
          totalCount page pageSize
        }
      }`,
      { query, page, pageSize }
    );
  }

  async exportDocuments(documentIds: string[]) {
    return this.graphql<{ exportDocuments: any }>(
      `mutation($ids: [ID!]!) {
        exportDocuments(documentIds: $ids) {
          exportId documentCount generatedAt
          documents { id title content classification tenantId }
        }
      }`,
      { ids: documentIds }
    );
  }

  // Users
  async getUsers() {
    return this.graphql<{ users: any[] }>(
      `{ users { id email role displayName createdAt } }`
    );
  }

  async getMe() {
    return this.graphql<{ me: any; tenant: any }>(
      `{ me { id email role displayName tenantId } tenant { id name slug plan } }`
    );
  }

  // Admin
  async impersonateUser(userId: string) {
    return this.request<{ token: string; user: any }>("/api/admin/impersonate", {
      method: "POST",
      body: { userId },
    });
  }

  async getAuditLog(page = 1, pageSize = 50) {
    return this.request<{ data: any[]; page: number; pageSize: number }>(
      `/api/admin/audit-log?page=${page}&pageSize=${pageSize}`
    );
  }

  // Preferences
  async getPreferences() {
    return this.request<{ data: any }>("/api/preferences");
  }

  async updatePreferences(updates: any) {
    return this.request<{ data: any }>("/api/preferences", {
      method: "PATCH",
      body: updates,
    });
  }

  // Promo
  async redeemPromo(code: string) {
    return this.request<{ success: boolean; discount: number }>("/api/promo/redeem", {
      method: "POST",
      body: { code },
    });
  }

  // Files
  async uploadFile(projectId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const token = this.getToken();
    const response = await fetch(`${API_BASE}/api/files/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  async getFiles(projectId: string) {
    return this.request<{ data: any[] }>(`/api/files?projectId=${projectId}`);
  }

  // API Keys
  async getApiKeys() {
    return this.request<{ data: any[] }>("/api/keys");
  }

  async createApiKey(label: string, scopes: string) {
    return this.request<{ data: any; key: string }>("/api/keys", {
      method: "POST",
      body: { label, scopes },
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/api/keys/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
export default api;
