package com.synap.notification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    /** 알림 생성. 자기 자신에게는 만들지 않는다. */
    @Transactional
    public void create(long recipientId, long actorId, String type, String actorName, String message, String link) {
        if (recipientId == actorId) {
            return;
        }
        repo.save(new Notification(recipientId, type, actorName, message, link));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(long uid) {
        return repo.findTop50ByUserIdOrderByIdDesc(uid).stream()
                .map(n -> new NotificationDto(n.getId(), n.getType(), n.getActorName(), n.getMessage(),
                        n.getLink(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(long uid) {
        return repo.countByUserIdAndReadFalse(uid);
    }

    @Transactional
    public void markAllRead(long uid) {
        repo.markAllRead(uid);
    }
}
