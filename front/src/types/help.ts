export type HelpConversationStatus = 'NEW' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';

export type HelpStatusFilter = 'OPEN' | 'ALL' | HelpConversationStatus;

export type HelpAuthor = 'VISITOR' | 'STAFF';

export interface HelpOptions {
  notificationsAvailable: boolean;
  minLength: number;
  maxLength: number;
}

export interface StartHelpConversationRequest {
  serviceId?: number;
  message: string;
  email?: string;
  language: string;
  website: string;
}

/** What the visitor sees: no staff names, e-mail addresses or internal ids. */
export interface HelpConversationView {
  status: HelpConversationStatus;
  serviceId: number | null;
  serviceName: string | null;
  organizationId: number | null;
  general: boolean;
  createdAt: string;
  updatedAt: string;
  notificationRequested: boolean;
  canWrite: boolean;
  messages: { author: HelpAuthor; body: string; createdAt: string }[];
}

export interface HelpConversationStarted {
  accessToken: string;
  notificationsAvailable: boolean;
  conversation: HelpConversationView;
}

export interface HelpConversationSummary {
  id: number;
  status: HelpConversationStatus;
  serviceId: number | null;
  serviceName: string | null;
  organizationId: number | null;
  general: boolean;
  language: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  createdAt: string;
  updatedAt: string;
  lastVisitorMessageAt: string;
  lastStaffReplyAt: string | null;
  messageCount: number;
  notificationRequested: boolean;
}

export interface HelpStaffMessage {
  id: number;
  author: HelpAuthor;
  body: string;
  createdAt: string;
  staffUserId: number | null;
  staffLabel: string | null;
}

export interface HelpConversationDetail {
  conversation: HelpConversationSummary;
  messages: HelpStaffMessage[];
}

export interface HelpInboxQuery {
  status?: HelpStatusFilter;
  organizationId?: number;
  serviceId?: number;
  general?: boolean;
  assignee?: 'me';
}
