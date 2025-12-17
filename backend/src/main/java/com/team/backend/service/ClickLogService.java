package com.team.backend.service;

import com.team.backend.api.dto.recommendation.ItemClickLogRequestDto;
import com.team.backend.repository.log.ItemClickLogJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClickLogService {

    private final ItemClickLogJdbcRepository itemClickLogJdbcRepository;

    /**
     * 추천 카드/아이템 클릭 이벤트 기록
     */
    public void logClick(ItemClickLogRequestDto dto) {
        itemClickLogJdbcRepository.write(dto);
    }
}