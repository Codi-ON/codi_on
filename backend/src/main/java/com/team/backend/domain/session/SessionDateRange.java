// src/main/java/com/team/backend/domain/session/SessionDateRange.java
package com.team.backend.domain.session;

import java.time.OffsetDateTime;

public record SessionDateRange(
        OffsetDateTime from,
        OffsetDateTime to
) {}