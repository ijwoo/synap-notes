package com.synap.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String type;

    @Column(name = "actor_name")
    private String actorName;

    @Column(nullable = false)
    private String message;

    private String link;

    @Column(nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Notification() {
    }

    public Notification(Long userId, String type, String actorName, String message, String link) {
        this.userId = userId;
        this.type = type;
        this.actorName = actorName;
        this.message = message;
        this.link = link;
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getActorName() {
        return actorName;
    }

    public String getMessage() {
        return message;
    }

    public String getLink() {
        return link;
    }

    public boolean isRead() {
        return read;
    }

    public void markRead() {
        this.read = true;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
