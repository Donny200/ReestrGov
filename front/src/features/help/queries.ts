import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignHelpConversation,
  getHelpAssigneeCandidates,
  getHelpConversation,
  getHelpInbox,
  getHelpInboxDetail,
  getHelpOptions,
  replyToHelpConversation,
  sendHelpFollowUp,
  setHelpConversationStatus,
  startHelpConversation,
} from '../../services/helpService';
import type { HelpConversationDetail, HelpConversationStatus, HelpInboxQuery, StartHelpConversationRequest } from '../../types/help';
import { helpKeys } from '../queryKeys';

export const useHelpOptions = () => useQuery({ queryKey: helpKeys.options(), queryFn: getHelpOptions, staleTime: 5 * 60_000 });

export const useStartHelpConversation = () =>
  useMutation({ mutationFn: (body: StartHelpConversationRequest) => startHelpConversation(body) });

/** Not cached after the page is left: the conversation is private to whoever holds the link. */
export const useHelpConversation = (token: string | null) =>
  useQuery({
    queryKey: helpKeys.conversation(token ?? ''),
    queryFn: () => getHelpConversation(token ?? ''),
    enabled: Boolean(token),
    gcTime: 0,
    retry: false,
  });

export function useHelpFollowUp(token: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ message, website }: { message: string; website: string }) => sendHelpFollowUp(token, message, website),
    onSuccess: (view) => client.setQueryData(helpKeys.conversation(token), view),
  });
}

export const useHelpInbox = (query: HelpInboxQuery, enabled = true) =>
  useQuery({ queryKey: helpKeys.inbox(query), queryFn: () => getHelpInbox(query), enabled });

export const useHelpInboxDetail = (id: number | null) =>
  useQuery({ queryKey: helpKeys.detail(id ?? 0), queryFn: () => getHelpInboxDetail(id ?? 0), enabled: id !== null });

export const useHelpCandidates = (id: number | null, enabled: boolean) =>
  useQuery({ queryKey: helpKeys.candidates(id ?? 0), queryFn: () => getHelpAssigneeCandidates(id ?? 0), enabled: enabled && id !== null });

function useInboxMutation<Input>(run: (input: Input) => Promise<HelpConversationDetail>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (detail) => {
      client.setQueryData(helpKeys.detail(detail.conversation.id), detail);
      return client.invalidateQueries({ queryKey: [...helpKeys.all, 'inbox'] });
    },
  });
}

export const useHelpReply = () => useInboxMutation(({ id, message }: { id: number; message: string }) => replyToHelpConversation(id, message));

export const useHelpStatus = () =>
  useInboxMutation(({ id, status }: { id: number; status: HelpConversationStatus }) => setHelpConversationStatus(id, status));

export const useHelpAssign = () => useInboxMutation(({ id, userId }: { id: number; userId: number | null }) => assignHelpConversation(id, userId));
