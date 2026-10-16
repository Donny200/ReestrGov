import { apiRequest } from './http';
import type { StaffMember } from '../types/api';
import type {
  HelpConversationDetail,
  HelpConversationStarted,
  HelpConversationStatus,
  HelpConversationSummary,
  HelpConversationView,
  HelpInboxQuery,
  HelpOptions,
  StartHelpConversationRequest,
} from '../types/help';

/** The private conversation token is sent in a header, never in the URL. */
export const HELP_TOKEN_HEADER = 'X-Conversation-Token';
const anonymous = { skipRefresh: true, skipUnauthorizedHandler: true } as const;

export const getHelpOptions = () => apiRequest<HelpOptions>('/api/help/options', anonymous);

export const startHelpConversation = (body: StartHelpConversationRequest) =>
  apiRequest<HelpConversationStarted>('/api/help/conversations', { method: 'POST', body, ...anonymous });

export const getHelpConversation = (token: string) =>
  apiRequest<HelpConversationView>('/api/help/conversation', { headers: { [HELP_TOKEN_HEADER]: token }, ...anonymous });

export const sendHelpFollowUp = (token: string, message: string, website: string) =>
  apiRequest<HelpConversationView>('/api/help/conversation/messages', {
    method: 'POST', body: { message, website }, headers: { [HELP_TOKEN_HEADER]: token }, ...anonymous,
  });

export const getHelpInbox = (query: HelpInboxQuery) =>
  apiRequest<HelpConversationSummary[]>('/api/help/inbox', { query: { ...query } });

export const getHelpInboxDetail = (id: number) => apiRequest<HelpConversationDetail>(`/api/help/inbox/${id}`);

export const replyToHelpConversation = (id: number, message: string) =>
  apiRequest<HelpConversationDetail>(`/api/help/inbox/${id}/replies`, { method: 'POST', body: { message } });

export const setHelpConversationStatus = (id: number, status: HelpConversationStatus) =>
  apiRequest<HelpConversationDetail>(`/api/help/inbox/${id}/status`, { method: 'PUT', body: { status } });

export const getHelpAssigneeCandidates = (id: number) => apiRequest<StaffMember[]>(`/api/help/inbox/${id}/candidates`);

export const assignHelpConversation = (id: number, userId: number | null) =>
  apiRequest<HelpConversationDetail>(`/api/help/inbox/${id}/assignee`, { method: 'PUT', body: { userId } });
