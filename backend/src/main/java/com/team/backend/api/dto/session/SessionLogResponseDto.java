package com.team.backend.api.dto.session;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogResponseDto {

    private Long id;

    /**
     * DB 적재 시각 (session_log.created_at)
     */
    private OffsetDateTime createdAt;

    /**
     * 이벤트 발생 시각 (session_log.occurred_at)
     * - SELECT에 포함시키는 경우에만 채워짐
     */
    private OffsetDateTime occurredAt;

    private Long userId;      // 지금 테이블에 없으면 null 유지
    private String sessionKey;

    /**
     * enum을 그대로 내려줘도 되고(String로 내려도 됨)
     * - 기존 호환 위해 String 유지
     */
    private String eventType;

    /**
     * jsonb(payload)::text
     */
    private String payloadJson;
}