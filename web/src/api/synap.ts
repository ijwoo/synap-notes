import { api } from './client';
import type {
  Comment,
  Graph,
  Invite,
  MemberDto,
  MultiGraph,
  Note,
  NoteInput,
  Notif,
  NoteSummary,
  Profile,
  RelatedNote,
  SearchResult,
  SearchScope,
  SpaceDto,
  User,
} from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const synap = {
  // auth
  login: (email: string, password: string) => api.post<AuthResponse>('/api/auth/login', { email, password }),
  register: (email: string, password: string, displayName: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password, displayName }),
  googleLogin: (idToken: string) => api.post<AuthResponse>('/api/auth/google', { idToken }),
  kakaoLogin: (accessToken: string) => api.post<AuthResponse>('/api/auth/kakao', { accessToken }),
  me: () => api.get<User>('/api/auth/me'),
  changeName: (displayName: string) => api.post<User>('/api/auth/name', { displayName }),
  changePassword: (currentPassword: string | null, newPassword: string) =>
    api.post<void>('/api/auth/password', { currentPassword, newPassword }),
  deleteAccount: () => api.del('/api/auth/me'),
  exportNotes: () => api.get<unknown[]>('/api/export/notes'),

  // notes
  getGraph: () => api.get<Graph>('/api/graph'),
  listNotes: () => api.get<NoteSummary[]>('/api/notes'),
  getNote: (id: number) => api.get<Note>(`/api/notes/${id}`),
  createNote: (input: NoteInput) => api.post<Note>('/api/notes', input),
  updateNote: (id: number, input: NoteInput) => api.put<Note>(`/api/notes/${id}`, input),
  deleteNote: (id: number) => api.del(`/api/notes/${id}`),
  getRelated: (id: number) => api.get<RelatedNote[]>(`/api/notes/${id}/related`),
  saveNote: (id: number) => api.post<Note>(`/api/notes/${id}/save`, {}),
  // 수동 링크
  listLinks: (id: number) => api.get<{ id: number; title: string }[]>(`/api/notes/${id}/links`),
  addLink: (id: number, targetId: number) => api.post<void>(`/api/notes/${id}/links/${targetId}`, {}),
  removeLink: (id: number, targetId: number) => api.del(`/api/notes/${id}/links/${targetId}`),
  search: (q: string, scope: SearchScope) => api.post<SearchResult[]>('/api/search', { q, scope }),

  // comments
  listComments: (id: number) => api.get<Comment[]>(`/api/notes/${id}/comments`),
  addComment: (id: number, body: string) => api.post<Comment>(`/api/notes/${id}/comments`, { body }),
  deleteComment: (id: number) => api.del(`/api/comments/${id}`),

  // spaces
  listSpaces: () => api.get<SpaceDto[]>('/api/spaces'),
  createSpace: (name: string, icon: string) => api.post<SpaceDto>('/api/spaces', { name, icon }),
  inviteToSpace: (id: number, email: string) => api.post<void>(`/api/spaces/${id}/invite`, { email }),
  spaceMembers: (id: number) => api.get<MemberDto[]>(`/api/spaces/${id}/members`),
  deleteSpace: (id: number) => api.del(`/api/spaces/${id}`),
  leaveSpace: (id: number) => api.post<void>(`/api/spaces/${id}/leave`, {}),
  spaceGraph: (id: number) => api.get<MultiGraph>(`/api/spaces/${id}/graph`),

  // community
  communityGraph: () => api.get<MultiGraph>('/api/community/graph'),

  // notifications
  listNotifications: () => api.get<Notif[]>('/api/notifications'),
  notificationsUnread: () => api.get<{ count: number }>('/api/notifications/unread-count').then((r) => r.count),
  markNotificationsRead: () => api.post<void>('/api/notifications/read', {}),

  // profile
  getProfile: (id: number) => api.get<Profile>(`/api/users/${id}`),

  // invites
  listInvites: () => api.get<Invite[]>('/api/invites'),
  acceptInvite: (id: number) => api.post<void>(`/api/invites/${id}/accept`, {}),
  declineInvite: (id: number) => api.post<void>(`/api/invites/${id}/decline`, {}),
};
