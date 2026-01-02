// src/main/java/com/team/backend/common/time/TimeRange.java
package com.team.backend.common.time;

import java.time.OffsetDateTime;

public record TimeRange(
        OffsetDateTime fromInclusive,
        OffsetDateTime toExclusive
) {}