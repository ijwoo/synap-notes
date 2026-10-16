export interface User {
  id: number;
  email: string;
  displayName: string;
}

export interface GraphNode {
  id: number;
  title: string;
  topic: string | null;
  degree: number;
  // --- 커뮤니티 프로토타입 전용(실제 /api/graph 에선 undefined) ---
  ownerId?: string;
  ownerName?: string;
  ownerInitial?: string;
  mine?: boolean;
  shared?: boolean;
}

export interface GraphEdge {
  source: number;
  target: number;
  similarity: number;
  /** 서로 다른 사용자 노드를 잇는 엣지(커뮤니티) */
  cross?: boolean;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type Visibility = 'private' | 'space' | 'public';

export interface NoteSummary {
  id: number;
  title: string;
  topic: string | null;
  visibility: Visibility;
  spaceId: number | null;
  imported: boolean;
  updatedAt: string;
}

export interface Note {
  id: number;
  title: string;
  body: string;
  topic: string | null;
  visibility: Visibility;
  spaceId: number | null;
  ownerId: number | null;
  mine: boolean;
  ownerName: string | null;
  sourceNoteId: number | null;
  sourceAuthorId: number | null;
  sourceAuthorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: number;
  displayName: string;
  publicNoteCount: number;
  notes: NoteSummary[];
}

export interface NoteInput {
  title: string;
  body: string;
  topic?: string | null;
  visibility?: Visibility;
  spaceId?: number | null;
}

export interface SpaceDto {
  id: number;
  name: string;
  icon: string | null;
  owner: boolean;
  memberCount: number;
  noteCount: number;
}

export interface MemberDto {
  id: number;
  displayName: string;
  email: string;
  owner: boolean;
}

export interface MultiGraphNode {
  id: number;
  title: string;
  topic: string | null;
  ownerId: number;
  ownerName: string;
  mine: boolean;
  degree: number;
}

export interface MultiGraph {
  nodes: MultiGraphNode[];
  edges: Array<{ source: number; target: number; similarity: number; cross: boolean }>;
}

/** /related 응답 항목 */
export interface RelatedNote {
  id: number;
  title: string;
  topic: string | null;
  similarity: number;
}

export type SearchScope = 'mine' | 'spaces' | 'public';

export interface SearchResult {
  id: number;
  title: string;
  topic: string | null;
  similarity: number;
  ownerId: number;
  ownerName: string;
  mine: boolean;
}

export interface Invite {
  id: number;
  spaceId: number;
  spaceName: string;
  spaceIcon: string | null;
  inviterName: string;
}

export interface Comment {
  id: number;
  body: string;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export interface Notif {
  id: number;
  type: 'comment' | 'invite' | string;
  actorName: string | null;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
