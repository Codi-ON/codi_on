// src/main/java/com/team/backend/api/dto/user/UserDashboardRequest.java
package com.team.backend.api.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
public class UserDashboardRequest {

    private Integer year;
    private Integer month;
}