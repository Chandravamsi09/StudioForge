export type UserRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'QA_ENGINEER' | 'VIEWER';
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type TargetPlatform = 'WINDOWS' | 'MAC' | 'LINUX' | 'ANDROID' | 'IOS' | 'PLAYSTATION' | 'XBOX' | 'NINTENDO_SWITCH' | 'WEBGL';
export type BuildStatus = 'QUEUED' | 'BUILDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type LiveOpsEventType = 'DOUBLE_XP' | 'HOLIDAY_EVENT' | 'TOURNAMENT' | 'FLASH_SALE' | 'FEATURE_FLAG' | 'ECONOMY_OVERRIDE' | 'CUSTOM';
export type LiveOpsStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type EventCategory = 'GAMEPLAY' | 'ECONOMY' | 'PERFORMANCE' | 'PROGRESSION' | 'SYSTEM';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  planTier?: PlanTier;
}

export interface BuildItem {
  id: string;
  tenantId: string;
  gameTitle: string;
  version: string;
  targetPlatform: TargetPlatform;
  status: BuildStatus;
  commitHash?: string;
  branch: string;
  artifactUrl?: string;
  artifactSizeBytes?: number;
  buildDurationSeconds?: number;
  changelog?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TicketItem {
  id: string;
  tenantId: string;
  gameTitle: string;
  title: string;
  description: string;
  reproductionSteps?: string;
  severity: TicketSeverity;
  status: TicketStatus;
  priority: TicketPriority;
  buildId?: string;
  reportedByUserId?: string;
  assignedToUserId?: string;
  environment?: string;
  logsUrl?: string;
  tags?: string[];
  createdAt: string;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniquePlayers: number;
  uniqueSessions: number;
  categoryBreakdown: Record<string, number>;
  topEventTypes: Array<{ eventType: string; count: number }>;
}

export interface AnalyticsEventItem {
  id: string;
  gameTitle: string;
  playerId: string;
  sessionId?: string;
  eventType: string;
  eventCategory: EventCategory;
  platform?: string;
  gameVersion?: string;
  properties: Record<string, any>;
  clientTimestamp: string;
  ingestedAt: string;
}

export interface LiveOpsEventItem {
  id: string;
  gameTitle: string;
  name: string;
  description?: string;
  type: LiveOpsEventType;
  status: LiveOpsStatus;
  startTime: string;
  endTime: string;
  configPayload: Record<string, any>;
  targetAudience?: string;
}

export interface SubscriptionInfo {
  id: string;
  tenantId: string;
  tenantName: string;
  planTier: PlanTier;
  status: string;
  monthlyPriceUsd: number;
  seats: {
    maxSeats: number;
    usedSeats: number;
    availableSeats: number;
    isSeatLimitReached: boolean;
  };
  cancelAtPeriodEnd: boolean;
}
