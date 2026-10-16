package com.synap.space;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "space_member")
public class SpaceMember {

    @EmbeddedId
    private Id id;

    @Column(nullable = false)
    private String role = "member";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SpaceMember() {
    }

    public SpaceMember(Long spaceId, Long userId, String role) {
        this.id = new Id(spaceId, userId);
        this.role = role;
    }

    public Long getSpaceId() {
        return id.spaceId;
    }

    public Long getUserId() {
        return id.userId;
    }

    public String getRole() {
        return role;
    }

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "space_id")
        private Long spaceId;

        @Column(name = "user_id")
        private Long userId;

        protected Id() {
        }

        public Id(Long spaceId, Long userId) {
            this.spaceId = spaceId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id that)) return false;
            return Objects.equals(spaceId, that.spaceId) && Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(spaceId, userId);
        }
    }
}
