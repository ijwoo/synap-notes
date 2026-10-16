package com.synap.notification;

import java.time.Instant;

public record NotificationDto(
        Long id,
        String type,
        String actorName,
        String message,
        String link,
        boolean read,
        Instant createdAt
) {
}
