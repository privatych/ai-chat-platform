const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok && response.status !== 400 && response.status !== 401) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string) {
    return this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  async getUsageStats() {
    return this.request<{
      messagesUsedToday: number;
      tokensUsedToday: number;
    }>('/api/auth/usage');
  }

  // Chat endpoints
  async createChat(title: string, model: string, projectId?: string) {
    return this.request<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ title, model, projectId }),
    });
  }

  async getChats() {
    return this.request<any[]>('/api/chat');
  }

  async getMessages(chatId: string) {
    return this.request<any[]>(`/api/chat/${chatId}/messages`);
  }

  async deleteChat(chatId: string) {
    return this.request<{ message: string }>(`/api/chat/${chatId}`, {
      method: 'DELETE',
    });
  }

  async renameChat(chatId: string, title: string) {
    return this.request<any>(`/api/chat/${chatId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  // Project endpoints
  async createProject(name: string, description?: string) {
    return this.request<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async listProjects() {
    return this.request<any[]>('/api/projects');
  }

  async getProject(projectId: string) {
    return this.request<any>(`/api/projects/${projectId}`);
  }

  async updateProject(projectId: string, name: string, description?: string) {
    return this.request<any>(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteProject(projectId: string) {
    return this.request<{ message: string }>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Context section endpoints
  async createContextSection(
    projectId: string,
    sectionType: 'about_project' | 'about_user' | 'technical' | 'documents',
    title: string,
    content?: string,
    files?: any[]
  ) {
    return this.request<any>(`/api/projects/${projectId}/context/sections`, {
      method: 'POST',
      body: JSON.stringify({ sectionType, title, content, files }),
    });
  }

  async listContextSections(projectId: string) {
    return this.request<any[]>(`/api/projects/${projectId}/context/sections`);
  }

  async updateContextSection(
    projectId: string,
    sectionId: string,
    title?: string,
    content?: string,
    files?: any[]
  ) {
    return this.request<any>(`/api/projects/${projectId}/context/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, files }),
    });
  }

  // SSE streaming for messages
  async streamMessage(
    chatId: string,
    content: string,
    model: string,
    attachments: any[] | undefined,
    onChunk: (chunk: string) => void,
    onDone: (tokensUsed: number) => void
  ) {
    const token = localStorage.getItem('auth_token');
    console.log('[API Client] Sending SSE request to:', `${API_URL}/api/chat/${chatId}/message`);

    const response = await fetch(`${API_URL}/api/chat/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, model, attachments }),
    });

    console.log('[API Client] Response status:', response.status);
    console.log('[API Client] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('[API Client] Stream ended');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          console.log('[API Client] Received data:', dataStr);

          try {
            const data = JSON.parse(dataStr);

            if (data.delta) {
              onChunk(data.delta);
            }

            if (data.done) {
              onDone(data.tokensUsed || 0);
              return;
            }
          } catch (e) {
            console.error('[API Client] Failed to parse JSON:', dataStr, e);
          }
        }
      }
    }
  }
}

export const apiClient = new ApiClient();
