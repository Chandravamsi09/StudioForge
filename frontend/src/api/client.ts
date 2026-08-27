import {
  UserProfile,
  BuildItem,
  TicketItem,
  AnalyticsSummary,
  AnalyticsEventItem,
  LiveOpsEventItem,
  SubscriptionInfo,
  PlanTier,
  TicketStatus,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('studioforge_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // --- Auth & Tenant ---
  async register(data: any) {
    return this.request<{ user: UserProfile; tokens: { accessToken: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: any) {
    return this.request<{ user: UserProfile; tokens: { accessToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<UserProfile>('/auth/me');
  }

  // --- Builds ---
  async getBuilds(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ items: BuildItem[]; total: number }>(`/builds?${query}`);
  }

  async getBuildMetrics() {
    return this.request<{
      totalBuilds: number;
      successBuilds: number;
      failedBuilds: number;
      activeBuilds: number;
      successRate: string;
    }>('/builds/metrics');
  }

  async createBuild(data: Partial<BuildItem>) {
    return this.request<BuildItem>('/builds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBuild(id: string, data: Partial<BuildItem>) {
    return this.request<BuildItem>(`/builds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBuild(id: string) {
    return this.request<{ success: boolean; message: string }>(`/builds/${id}`, {
      method: 'DELETE',
    });
  }

  // --- QA & Bug Tracker ---
  async getTickets(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ items: TicketItem[]; total: number }>(`/qa/tickets?${query}`);
  }

  async getQAMetrics() {
    return this.request<{
      totalTickets: number;
      openTickets: number;
      inProgressTickets: number;
      resolvedTickets: number;
      closedTickets: number;
      blockerCount: number;
      criticalCount: number;
      resolutionRate: string;
    }>('/qa/tickets/metrics');
  }

  async createTicket(data: Partial<TicketItem>) {
    return this.request<TicketItem>('/qa/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    return this.request<TicketItem>(`/qa/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteTicket(id: string) {
    return this.request<{ success: boolean; message: string }>(`/qa/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Analytics ---
  async getAnalyticsSummary(gameTitle?: string) {
    const query = gameTitle ? `?gameTitle=${encodeURIComponent(gameTitle)}` : '';
    return this.request<AnalyticsSummary>(`/analytics/summary${query}`);
  }

  async getAnalyticsEvents(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ items: AnalyticsEventItem[]; total: number }>(`/analytics/events?${query}`);
  }

  async ingestEvent(data: any) {
    return this.request<{ success: boolean; eventId: string }>('/analytics/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Live-Ops ---
  async getLiveOpsEvents(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ items: LiveOpsEventItem[]; total: number }>(`/live-ops/events?${query}`);
  }

  async createLiveOpsEvent(data: Partial<LiveOpsEventItem>) {
    return this.request<LiveOpsEventItem>('/live-ops/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLiveOpsEvent(id: string, data: Partial<LiveOpsEventItem>) {
    return this.request<LiveOpsEventItem>(`/live-ops/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLiveOpsEvent(id: string) {
    return this.request<{ success: boolean; message: string }>(`/live-ops/events/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Billing ---
  async getSubscription() {
    return this.request<SubscriptionInfo>('/billing/subscription');
  }

  async upgradePlan(planTier: PlanTier) {
    return this.request<SubscriptionInfo>('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planTier }),
    });
  }

  async inviteMember(data: any) {
    return this.request<{ success: boolean; message: string; seatsUsed: number; maxSeats: number }>(
      '/billing/invite',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  }
}

export const api = new ApiClient();
