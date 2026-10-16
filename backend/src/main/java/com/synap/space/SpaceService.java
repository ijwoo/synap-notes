package com.synap.space;

import com.synap.auth.User;
import com.synap.auth.UserRepository;
import com.synap.note.NoteRepository;
import com.synap.notification.NotificationService;
import com.synap.space.dto.SpaceDtos.InviteDto;
import com.synap.space.dto.SpaceDtos.MemberDto;
import com.synap.space.dto.SpaceDtos.SpaceDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SpaceService {

    private final SpaceRepository spaces;
    private final SpaceMemberRepository members;
    private final SpaceInviteRepository invites;
    private final UserRepository users;
    private final NoteRepository notes;
    private final NotificationService notifications;

    public SpaceService(SpaceRepository spaces, SpaceMemberRepository members,
                        SpaceInviteRepository invites, UserRepository users, NoteRepository notes,
                        NotificationService notifications) {
        this.spaces = spaces;
        this.members = members;
        this.invites = invites;
        this.users = users;
        this.notes = notes;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<SpaceDto> listMine(long uid) {
        return spaces.findByMember(uid).stream().map(s -> toDto(s, uid)).toList();
    }

    @Transactional
    public SpaceDto create(long uid, String name, String icon) {
        Space space = spaces.save(new Space(name.trim(), icon, uid));
        members.save(new SpaceMember(space.getId(), uid, "owner"));
        return toDto(space, uid);
    }

    /** 초대 = pending 초대 생성(즉시 멤버 아님). 받는 사람이 수락해야 멤버가 된다. */
    @Transactional
    public void invite(long uid, long spaceId, String email) {
        requireMember(spaceId, uid);
        User invitee = users.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 이메일의 사용자가 없어요."));
        if (members.existsByIdSpaceIdAndIdUserId(spaceId, invitee.getId())) {
            return; // 이미 멤버
        }
        SpaceInvite inv = invites.findBySpaceIdAndInviteeId(spaceId, invitee.getId())
                .orElse(new SpaceInvite(spaceId, uid, invitee.getId()));
        inv.setInviterId(uid);
        inv.setStatus("pending");
        invites.save(inv);

        String inviterName = users.findById(uid).map(User::getDisplayName).orElse("");
        String spaceName = spaces.findById(spaceId).map(Space::getName).orElse("스페이스");
        notifications.create(invitee.getId(), uid, "invite", inviterName,
                inviterName + "님이 '" + spaceName + "' 스페이스에 초대했어요", "/community");
    }

    @Transactional(readOnly = true)
    public List<InviteDto> listInvites(long uid) {
        return invites.findByInviteeIdAndStatusOrderByIdDesc(uid, "pending").stream().map(inv -> {
            Space sp = spaces.findById(inv.getSpaceId()).orElse(null);
            String inviter = users.findById(inv.getInviterId()).map(User::getDisplayName).orElse("?");
            return new InviteDto(inv.getId(), inv.getSpaceId(),
                    sp != null ? sp.getName() : "삭제된 스페이스", sp != null ? sp.getIcon() : null, inviter);
        }).toList();
    }

    @Transactional
    public void respondInvite(long uid, long inviteId, boolean accept) {
        SpaceInvite inv = invites.findById(inviteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "초대가 없어요."));
        if (!inv.getInviteeId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 초대가 아니에요.");
        }
        if (accept && !members.existsByIdSpaceIdAndIdUserId(inv.getSpaceId(), uid)) {
            members.save(new SpaceMember(inv.getSpaceId(), uid, "member"));
        }
        inv.setStatus(accept ? "accepted" : "declined");
        invites.save(inv);
    }

    /** 스페이스 삭제(방장만). 공유 노트는 각 소유자의 개인 노트로 되돌림. */
    @Transactional
    public void deleteSpace(long uid, long spaceId) {
        Space sp = spaces.findById(spaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "스페이스가 없어요."));
        if (!sp.getOwnerId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방장만 삭제할 수 있어요.");
        }
        notes.detachSpace(spaceId);
        spaces.deleteById(spaceId); // cascade: space_member, space_invite
    }

    /** 스페이스 나가기(멤버). 내가 공유한 노트는 개인으로 되돌림. 방장은 나갈 수 없음. */
    @Transactional
    public void leaveSpace(long uid, long spaceId) {
        Space sp = spaces.findById(spaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "스페이스가 없어요."));
        if (sp.getOwnerId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방장은 나갈 수 없어요. 스페이스를 삭제하세요.");
        }
        if (!members.existsByIdSpaceIdAndIdUserId(spaceId, uid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "스페이스 멤버가 아니에요.");
        }
        notes.detachUserFromSpace(spaceId, uid);
        members.deleteMember(spaceId, uid);
    }

    @Transactional(readOnly = true)
    public List<MemberDto> members(long uid, long spaceId) {
        Space space = requireMember(spaceId, uid);
        return users.findAllById(members.findUserIdsBySpaceId(spaceId)).stream()
                .map(u -> new MemberDto(u.getId(), u.getDisplayName(), u.getEmail(),
                        u.getId().equals(space.getOwnerId())))
                .toList();
    }

    public Space requireMember(long spaceId, long uid) {
        Space space = spaces.findById(spaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "스페이스가 없어요."));
        if (!members.existsByIdSpaceIdAndIdUserId(spaceId, uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "스페이스 멤버가 아니에요.");
        }
        return space;
    }

    private SpaceDto toDto(Space s, long uid) {
        int memberCount = members.findUserIdsBySpaceId(s.getId()).size();
        long noteCount = notes.countBySpaceIdAndVisibility(s.getId(), "space");
        return new SpaceDto(s.getId(), s.getName(), s.getIcon(),
                s.getOwnerId() == uid, memberCount, noteCount);
    }
}
