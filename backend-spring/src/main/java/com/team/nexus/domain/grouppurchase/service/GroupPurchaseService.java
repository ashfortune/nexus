package com.team.nexus.domain.grouppurchase.service;

import com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.dto.PaymentConfirmRequestDto;

import java.util.List;
import java.util.UUID;

public interface GroupPurchaseService {
    GroupPurchaseResponseDto createGroupPurchase(GroupPurchaseRequestDto requestDto, UUID userId);
    List<GroupPurchaseResponseDto> getAllGroupPurchases();
    List<GroupPurchaseResponseDto> searchGroupPurchases(String itemName, String region);
    GroupPurchaseResponseDto getGroupPurchase(UUID id);
    boolean checkParticipation(UUID groupBuyId, UUID userId);
    void participate(UUID groupBuyId, UUID userId, GroupOrderRequestDto orderDto);
    void confirmPayment(UUID groupBuyId, UUID userId, PaymentConfirmRequestDto confirmDto);
    void deleteGroupPurchase(UUID id, UUID userId);
    void cleanupExpiredGroupPurchases();
}
