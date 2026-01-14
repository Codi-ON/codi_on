// src/main/java/com/team/backend/api/dto/log/SessionLogRequestDto.java
package com.team.backend.api.dto.log;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogRequestDto {

    // nullable: null이면 Service에서 now(KST) 채움
    private OffsetDateTime createdAt;

    // nullable
    private Long userId;

    @NotBlank
    private String sessionKey;

    @NotBlank
    private String eventType;   // START/END/ERROR/HEARTBEAT/ACTIVE...

    // nullable 허용 (Service에서 null이면 {}로 채움)
    private Map<String, Object> payload;

    private static final ObjectMapper OM = new ObjectMapper();

    public SessionLogRequestDto fillSessionKeyIfMissing(String headerSessionKey) {
        if (this.sessionKey == null || this.sessionKey.isBlank()) {
            this.sessionKey = headerSessionKey;
        }
        return this;
    }

    @JsonIgnore
    public String getPayloadJson() {
        if (payload == null) return null;
        try {
            return OM.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"payloadSerializeError\":true}";
        }
    }
}