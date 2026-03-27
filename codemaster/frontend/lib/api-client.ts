const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('codemaster_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers as any,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('codemaster_token');
        localStorage.removeItem('codemaster_user');
      }
      throw new Error('Unauthorized: 401');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'API request failed');
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('codemaster_token', data.access_token);
    localStorage.setItem('codemaster_user', JSON.stringify(data));
    return data;
  }

  async logout() {
    localStorage.removeItem('codemaster_token');
    localStorage.removeItem('codemaster_user');
  }

  // Problems & Submissions
  async getProblems() { return this.request('/api/problems/'); }
  async getProblem(id: number) { return this.request(`/api/problems/${id}`); }
  async runCode(language: string, code: string, problemId?: number, testCases?: any[]) {
    return this.request('/api/submissions/run', {
      method: 'POST',
      body: JSON.stringify({ language, code, problem_id: problemId, test_cases: testCases }),
    });
  }
  async submitCode(problemId: number, language: string, code: string) {
    return this.request('/api/submissions/submit', {
      method: 'POST',
      body: JSON.stringify({ problem_id: problemId, language, code }),
    });
  }

  // AI & OCR
  async getHint(problemId: number, code: string, level: number) {
    return this.request('/api/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ problem_id: problemId, code, hint_level: level }),
    });
  }
  async analyzeBugs(code: string, language: string, problemId?: number) {
    return this.request('/api/ai/analyze-bugs', {
      method: 'POST',
      body: JSON.stringify({ code, language, problem_id: problemId }),
    });
  }
  async getFlowchart(code: string, language: string) {
    return this.request('/api/ai/flowchart', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async ocrImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/api/ai/ocr/image`, {
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('OCR failed');
    return response.json();
  }

  async uploadSyllabus(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/api/ai/upload-syllabus`, {
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Syllabus upload failed');
    return response.json();
  }

  // Dashboard
  async getDashboardReport() {
    return this.request('/api/dashboard/report');
  }

  async getRecommendations() {
    return this.request('/api/dashboard/recommend');
  }

  async traceCode(code: string, inputArray: any[]) {
    return this.request('/visualize/trace', {
      method: 'POST',
      body: JSON.stringify({ code, input_array: inputArray, build_flowchart: true }),
    });
  }
}

export const apiClient = new ApiClient();
