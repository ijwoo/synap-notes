import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphCanvas from '../graph/GraphCanvas';
import SimilarityBar from '../../components/ui/SimilarityBar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Drawer, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { confirm } from '../../store/useConfirm';
import { toast } from '../../store/useToast';
import { synap } from '../../api/synap';
import type { Graph, GraphNode, Invite, MemberDto, MultiGraph, Note, SpaceDto } from '../../types';
import {
  Bell, Check, ChevronDown, ChevronLeft, Globe, Lock, Plus, SpaceIcon, SPACE_ICON_OPTIONS, UserPlus, Users, X,
} from '../../lib/icons';
import '../graph/Graph.css';

type View = { kind: 'mine' } | { kind: 'space'; id: number } | { kind: 'community' };
type Overlay = 'none' | 'picker' | 'create' | 'invite' | 'invites';

function mapMulti(mg: MultiGraph): { graph: Graph; nodes: Map<number, GraphNode> } {
  const nodes: GraphNode[] = mg.nodes.map((n) => ({
    id: n.id, title: n.title, topic: n.topic, degree: n.degree,
    ownerId: String(n.ownerId), ownerName: n.ownerName, ownerInitial: n.ownerName?.[0] ?? '?', mine: n.mine,
  }));
  return { graph: { nodes, edges: mg.edges.map((e) => ({ ...e })) }, nodes: new Map(nodes.map((n) => [n.id, n])) };
}

export default function CommunityScreen() {
  const navigate = useNavigate();
  const selectedId = useUiStore((s) => s.selectedNodeId);
  const clear = useUiStore((s) => s.clearSelection);
  const myId = useAuthStore((s) => s.user?.id);

  const [view, setView] = useState<View>({ kind: 'community' });
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [nodeMap, setNodeMap] = useState<Map<number, GraphNode>>(new Map());

  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<string>('book');
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [selNote, setSelNote] = useState<Note | null>(null);

  const loadSpaces = useCallback(() => synap.listSpaces().then(setSpaces).catch(() => {}), []);
  const loadInvites = useCallback(() => synap.listInvites().then(setInvites).catch(() => {}), []);
  useEffect(() => {
    loadSpaces();
    loadInvites();
  }, [loadSpaces, loadInvites]);

  const loadGraph = useCallback(async (v: View) => {
    if (v.kind === 'mine') {
      const g = await synap.getGraph();
      const nodes: GraphNode[] = g.nodes.map((n) => ({ ...n, mine: true }));
      setGraph({ nodes, edges: g.edges });
      setNodeMap(new Map(nodes.map((n) => [n.id, n])));
    } else {
      const mg = v.kind === 'space' ? await synap.spaceGraph(v.id) : await synap.communityGraph();
      const { graph: gg, nodes } = mapMulti(mg);
      setGraph(gg);
      setNodeMap(nodes);
    }
  }, []);

  useEffect(() => {
    clear();
    loadGraph(view);
    return () => clear();
  }, [view, loadGraph, clear]);

  const activeSpace = view.kind === 'space' ? spaces.find((s) => s.id === view.id) : undefined;

  const selNode = selectedId != null ? nodeMap.get(selectedId) : undefined;
  const related = useMemo(() => {
    if (!graph || selectedId == null) return [];
    const out: Array<{ node: GraphNode; similarity: number }> = [];
    for (const e of graph.edges) {
      const other = e.source === selectedId ? e.target : e.target === selectedId ? e.source : null;
      if (other == null) continue;
      const node = nodeMap.get(other);
      if (node) out.push({ node, similarity: e.similarity });
    }
    return out.sort((a, b) => b.similarity - a.similarity);
  }, [graph, selectedId, nodeMap]);

  useEffect(() => {
    setSelNote(null);
    if (selNode?.mine && selectedId != null) synap.getNote(selectedId).then(setSelNote).catch(() => {});
  }, [selectedId, selNode?.mine]);

  const noteRange = selNote ? (selNote.visibility === 'space' ? `space:${selNote.spaceId}` : selNote.visibility) : 'private';
  const changeScope = async (key: string) => {
    if (!selNote) return;
    const visibility = key === 'private' || key === 'public' ? key : 'space';
    const spaceId = key.startsWith('space:') ? Number(key.slice(6)) : null;
    const updated = await synap.updateNote(selNote.id, {
      title: selNote.title, body: selNote.body, topic: selNote.topic, visibility, spaceId,
    });
    setSelNote(updated);
    await loadGraph(view);
    await loadSpaces();
  };

  const pick = (v: View) => {
    setView(v);
    setOverlay('none');
  };
  const submitCreate = async () => {
    if (!newName.trim()) return;
    const created = await synap.createSpace(newName.trim(), newIcon);
    setNewName('');
    await loadSpaces();
    setView({ kind: 'space', id: created.id });
    setOverlay('none');
  };
  const openInvite = () => {
    if (view.kind !== 'space') return;
    setInviteMsg(null);
    setOverlay('invite');
    synap.spaceMembers(view.id).then(setMembers).catch(() => {});
  };
  const isOwnerOfActive = members.find((mb) => mb.owner)?.id === myId;
  const leaveOrDeleteSpace = async () => {
    if (view.kind !== 'space') return;
    const owner = isOwnerOfActive;
    const ok = await confirm(
      owner
        ? { title: '스페이스를 삭제할까요?', message: '공유된 노트는 각자 개인 노트로 돌아가요.', confirmText: '삭제', danger: true }
        : { title: '스페이스에서 나갈까요?', confirmText: '나가기', danger: true },
    );
    if (!ok) return;
    if (owner) await synap.deleteSpace(view.id);
    else await synap.leaveSpace(view.id);
    await loadSpaces();
    setView({ kind: 'community' });
    setOverlay('none');
    toast(owner ? '스페이스를 삭제했어요' : '스페이스에서 나갔어요');
  };

  const submitInvite = async () => {
    if (view.kind !== 'space' || !inviteEmail.trim()) return;
    try {
      await synap.inviteToSpace(view.id, inviteEmail.trim());
      setInviteEmail('');
      setInviteMsg('초대를 보냈어요.');
      synap.spaceMembers(view.id).then(setMembers).catch(() => {});
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : '초대 실패');
    }
  };
  const respond = async (id: number, accept: boolean) => {
    if (accept) await synap.acceptInvite(id);
    else await synap.declineInvite(id);
    await loadInvites();
    await loadSpaces();
    if (overlay === 'invites') setOverlay('none');
    if (accept) toast('스페이스에 참여했어요');
  };

  const ctxIcon =
    view.kind === 'mine' ? <Users size={18} /> : view.kind === 'community' ? <Globe size={18} /> : <SpaceIcon name={activeSpace?.icon ?? null} size={18} />;
  const ctxLabel = view.kind === 'mine' ? '내 그래프' : view.kind === 'community' ? '커뮤니티' : activeSpace?.name ?? '스페이스';

  const rangeChip = (active: boolean) =>
    cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground');

  return (
    <main className="graph-screen">
      {/* 상단 */}
      <div className="absolute inset-x-3.5 z-30 flex items-center gap-2.5" style={{ top: 'calc(12px + env(safe-area-inset-top))' }}>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background/90 backdrop-blur" onClick={() => navigate('/graph')}>
          <ChevronLeft />
        </Button>
        <button
          onClick={() => setOverlay('picker')}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/90 px-3.5 font-bold backdrop-blur"
        >
          {ctxIcon}
          <span className="truncate">{ctxLabel}</span>
          <ChevronDown size={15} className="text-muted-foreground" />
        </button>
        <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-xl bg-background/90 backdrop-blur" onClick={() => setOverlay('invites')}>
          <Bell size={18} />
          {invites.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {invites.length}
            </span>
          )}
        </Button>
      </div>

      {activeSpace && (
        <div className="absolute left-4 z-25 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur"
          style={{ top: 'calc(62px + env(safe-area-inset-top))' }}>
          <Users size={14} /> {activeSpace.memberCount}명 · 공유 노트 {activeSpace.noteCount}개
          <button className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-accent-foreground" onClick={openInvite}>
            <UserPlus size={13} /> 초대
          </button>
        </div>
      )}

      {graph && <GraphCanvas graph={graph} />}

      {/* 범례 */}
      <div className="absolute left-4 z-40 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-background/85 px-3 py-2.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 14px)' }}>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-foreground" /> 내 노트</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="relative inline-block h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-foreground" />
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-background bg-muted-foreground" />
          </span>
          다른 사람 (이니셜)
        </span>
        <span className="font-medium text-muted-foreground/70">색 = 의미 군집</span>
      </div>

      {graph && graph.nodes.length === 0 && (
        <div className="absolute left-1/2 top-[46%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background/80 px-4 py-2.5 text-center text-sm text-muted-foreground">
          {view.kind === 'community' ? '공개한 노트가 없어요. 노트를 공개하면 비슷한 생각과 이어져요.' : '이 스페이스에 공유된 노트가 아직 없어요.'}
        </div>
      )}

      {/* 컨텍스트 피커 */}
      <Drawer open={overlay === 'picker'} onOpenChange={(o) => !o && setOverlay('none')}>
        <DrawerContent>
          <DrawerTitle className="sr-only">보기 전환</DrawerTitle>
          {invites.length > 0 && (
            <button onClick={() => setOverlay('invites')} className="mb-2 flex items-center gap-3 rounded-lg bg-accent p-3 text-left">
              <Bell size={18} className="text-accent-foreground" />
              <span className="flex-1 font-semibold text-accent-foreground">받은 초대 {invites.length}</span>
              <ChevronDown size={16} className="-rotate-90 text-accent-foreground" />
            </button>
          )}
          <div className="px-1 pb-1 pt-1 text-xs font-bold text-muted-foreground">보기 전환</div>
          <PickerItem icon={<Users size={20} />} title="내 그래프" sub="나만 보는 내 노트" on={view.kind === 'mine'} onClick={() => pick({ kind: 'mine' })} />
          <div className="my-1.5 h-px bg-border" />
          <div className="px-1 py-1 text-xs font-bold text-muted-foreground">내 스페이스</div>
          {spaces.map((s) => (
            <PickerItem key={s.id} icon={<SpaceIcon name={s.icon} size={20} />} title={s.name} sub={`${s.memberCount}명 · 공유 노트 ${s.noteCount}개`} on={view.kind === 'space' && view.id === s.id} onClick={() => pick({ kind: 'space', id: s.id })} />
          ))}
          <PickerItem icon={<Plus size={20} />} title="스페이스 만들기" sub="새 그룹을 만들어 초대해요" on={false} onClick={() => setOverlay('create')} />
          <div className="my-1.5 h-px bg-border" />
          <PickerItem icon={<Globe size={20} />} title="커뮤니티" sub="전체에서 내 노트와 이어진 사람들" on={view.kind === 'community'} onClick={() => pick({ kind: 'community' })} />
        </DrawerContent>
      </Drawer>

      {/* 만들기 */}
      <Drawer open={overlay === 'create'} onOpenChange={(o) => !o && setOverlay('picker')}>
        <DrawerContent>
          <DrawerTitle>스페이스 만들기</DrawerTitle>
          <div className="my-3 grid grid-cols-8 gap-1.5">
            {SPACE_ICON_OPTIONS.map((name) => (
              <button key={name} onClick={() => setNewIcon(name)} className={cn('flex aspect-square items-center justify-center rounded-xl border-2', newIcon === name ? 'border-primary bg-accent text-accent-foreground' : 'border-transparent bg-secondary text-muted-foreground')}>
                <SpaceIcon name={name} size={20} />
              </button>
            ))}
          </div>
          <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="스페이스 이름 (예: 논문 리딩 모임)" />
          <Button className="mt-3.5 h-12" disabled={!newName.trim()} onClick={submitCreate}>만들기</Button>
        </DrawerContent>
      </Drawer>

      {/* 초대 보내기 */}
      <Drawer open={overlay === 'invite'} onOpenChange={(o) => !o && setOverlay('none')}>
        <DrawerContent>
          <DrawerTitle className="flex items-center gap-2">
            <SpaceIcon name={activeSpace?.icon ?? null} size={18} /> {activeSpace?.name} 초대
          </DrawerTitle>
          <div className="mt-3 flex items-center gap-2">
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="이메일 (예: jiwoo@synap.dev)" type="email" autoCapitalize="none" />
            <Button onClick={submitInvite} disabled={!inviteEmail.trim()}>초대</Button>
          </div>
          {inviteMsg && <div className="mt-2 text-[13px] text-muted-foreground">{inviteMsg}</div>}
          <div className="my-1.5 mt-4 h-px bg-border" />
          <div className="px-1 py-1 text-xs font-bold text-muted-foreground">멤버 {members.length}</div>
          <div className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
            {members.map((mb) => (
              <div key={mb.id} className="flex items-center gap-3 px-1 py-2">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{mb.displayName?.[0] ?? '?'}</AvatarFallback></Avatar>
                <span className="flex-1 font-semibold">{mb.displayName}{mb.owner ? ' · 방장' : ''}</span>
                <span className="text-xs text-muted-foreground">{mb.email}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <Button variant="ghost" className="w-full text-destructive" onClick={leaveOrDeleteSpace}>
              {isOwnerOfActive ? '스페이스 삭제' : '스페이스 나가기'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 받은 초대 */}
      <Drawer open={overlay === 'invites'} onOpenChange={(o) => !o && setOverlay('none')}>
        <DrawerContent>
          <DrawerTitle>받은 초대</DrawerTitle>
          <div className="mt-3 flex flex-col gap-2">
            {invites.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">받은 초대가 없어요.</div>}
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                <SpaceIcon name={inv.spaceIcon} size={22} className="text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{inv.spaceName}</div>
                  <div className="text-xs text-muted-foreground">{inv.inviterName} 님의 초대</div>
                </div>
                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => respond(inv.id, false)}><X size={16} /></Button>
                <Button size="sm" onClick={() => respond(inv.id, true)}><Check size={16} /> 수락</Button>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 노드 시트 */}
      <Drawer open={selNode != null && overlay === 'none'} onOpenChange={(o) => !o && clear()}>
        <DrawerContent>
          {selNode && (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <DrawerTitle className="leading-snug">{selNode.title}</DrawerTitle>
                {selNode.mine ? (
                  <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">나</span>
                ) : (
                  <button
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    onClick={() => selNode.ownerId && navigate(`/profile/${selNode.ownerId}`)}
                  >
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{selNode.ownerInitial}</AvatarFallback></Avatar>
                    <span className="underline-offset-2 hover:underline">{selNode.ownerName}</span>
                  </button>
                )}
              </div>

              {selNode.mine && selNote && (
                <div className="mb-4 rounded-lg bg-secondary p-3.5">
                  <div className="mb-2.5 text-[13px] font-bold text-muted-foreground">공유 범위</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className={rangeChip(noteRange === 'private')} onClick={() => changeScope('private')}><Lock size={14} /> 나만</button>
                    {spaces.map((s) => (
                      <button key={s.id} className={rangeChip(noteRange === `space:${s.id}`)} onClick={() => changeScope(`space:${s.id}`)}>
                        <SpaceIcon name={s.icon} size={14} /> {s.name}
                      </button>
                    ))}
                    <button className={rangeChip(noteRange === 'public')} onClick={() => changeScope('public')}><Globe size={14} /> 커뮤니티</button>
                  </div>
                </div>
              )}

              <div className="mb-2 text-[13px] font-semibold text-muted-foreground">연결된 노트 · {related.length}</div>
              <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
                {related.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">아직 연결된 노트가 없어요.</div>}
                {related.map(({ node, similarity }) => (
                  <button key={node.id} onClick={() => useUiStore.getState().selectNode(node.id)} className="flex flex-col gap-2.5 rounded-md bg-secondary p-3 text-left transition-colors active:bg-border">
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="truncate text-[15px] font-semibold">{node.title}</span>
                      {node.mine ? (
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">나</span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                          <Avatar className="h-4 w-4"><AvatarFallback className="text-[9px]">{node.ownerInitial}</AvatarFallback></Avatar>
                          {node.ownerName}
                        </span>
                      )}
                    </div>
                    <SimilarityBar value={similarity} />
                  </button>
                ))}
              </div>

              <Button className="mt-3.5 h-12" onClick={() => navigate(`/notes/${selNode.id}`)}>노트 열기</Button>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  );
}

function PickerItem({ icon, title, sub, on, onClick }: { icon: React.ReactNode; title: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors', on ? 'bg-accent' : 'active:bg-secondary')}>
      <span className="flex h-7 w-7 items-center justify-center text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-[12.5px] text-muted-foreground">{sub}</span>
      </span>
      {on && <Check size={18} className="text-primary" />}
    </button>
  );
}
