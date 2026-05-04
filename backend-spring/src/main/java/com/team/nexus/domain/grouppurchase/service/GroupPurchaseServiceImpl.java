package com.team.nexus.domain.grouppurchase.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.dto.PaymentConfirmRequestDto;
import com.team.nexus.domain.grouppurchase.repository.GroupOrderRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.global.entity.GroupOrder;
import com.team.nexus.global.entity.GroupPurchase;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class GroupPurchaseServiceImpl implements GroupPurchaseService {

    private final GroupPurchaseRepository groupPurchaseRepository;
    private final GroupOrderRepository groupOrderRepository;
    private final UserRepository userRepository;
    private final ExternalApiService externalApiService;

    @Value("${toss.secret-key}")
    private String tossSecretKey;

    @Override
    @Transactional
    public GroupPurchaseResponseDto createGroupPurchase(GroupPurchaseRequestDto requestDto, UUID userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        GroupPurchase groupPurchase = GroupPurchase.builder()
                .user(creator)
                .title(requestDto.getTitle())
                .itemName(requestDto.getItemName())
                .itemPrice(requestDto.getItemPrice())
                .targetCount(requestDto.getTargetCount())
                .currentCount(0)
                .startDate(LocalDateTime.now())
                .endDate(requestDto.getEndDate())
                .status("RECRUITING")
                .description(requestDto.getDescription())
                .imageUrl(requestDto.getImageUrl())
                .region(requestDto.getRegion())
                .build();

        GroupPurchase saved = groupPurchaseRepository.save(groupPurchase);
        return convertToDto(saved);
    }

    @Override
    public List<GroupPurchaseResponseDto> getAllGroupPurchases() {
        return groupPurchaseRepository.findAllCustomSorted().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupPurchaseResponseDto> searchGroupPurchases(String itemName, String region) {
        String searchItemName = (itemName != null && !itemName.trim().isEmpty()) ? itemName : null;
        String searchRegion = (region != null && !region.trim().isEmpty()) ? region : null;

        return groupPurchaseRepository.searchGroupPurchases(searchItemName, searchRegion).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public GroupPurchaseResponseDto getGroupPurchase(UUID id) {
        GroupPurchase groupPurchase = groupPurchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));
        return convertToDto(groupPurchase);
    }

    @Override
    public boolean checkParticipation(UUID groupBuyId, UUID userId) {
        boolean exists = groupOrderRepository.existsByGroupPurchaseIdAndUserId(groupBuyId, userId);
        log.info("[Check Participation] GroupBuyId: {}, UserId: {}, Exists: {}", groupBuyId, userId, exists);
        return exists;
    }

    @Override
    @Transactional
    public void participate(UUID groupBuyId, UUID userId, GroupOrderRequestDto orderDto) {
        if (groupOrderRepository.existsByGroupPurchaseIdAndUserId(groupBuyId, userId)) {
            throw new RuntimeException("이미 참여한 공동구매입니다.");
        }

        GroupPurchase groupPurchase = groupPurchaseRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        GroupOrder order = GroupOrder.builder()
                .id(UUID.randomUUID().toString())
                .groupPurchase(groupPurchase)
                .user(user)
                .orderCount(orderDto.getOrderCount())
                .totalPrice(groupPurchase.getItemPrice() * orderDto.getOrderCount())
                .pgProvider(orderDto.getPgProvider())
                .paymentMethod(orderDto.getPaymentMethod())
                .pgTid(orderDto.getPgTid())
                .paymentStatus("PAID")
                .paidAt(LocalDateTime.now())
                .build();

        groupOrderRepository.save(order);

        groupPurchase.setCurrentCount(groupPurchase.getCurrentCount() + orderDto.getOrderCount());

        if (groupPurchase.getCurrentCount() >= groupPurchase.getTargetCount()) {
            groupPurchase.setStatus("COMPLETED");
        }

        groupPurchaseRepository.save(groupPurchase);
    }

    @Override
    @Transactional
    public void confirmPayment(UUID groupBuyId, UUID userId, PaymentConfirmRequestDto confirmDto) {
        if (confirmDto.getPaymentKey() != null && confirmDto.getPaymentKey().startsWith("MOCK_")) {
            GroupOrderRequestDto orderDto = new GroupOrderRequestDto();
            orderDto.setOrderCount(1);
            orderDto.setPgProvider("KAKAO_PAY_MOCK");
            orderDto.setPaymentMethod("MOCK_PAYMENT");
            orderDto.setPgTid(confirmDto.getPaymentKey());
            participate(groupBuyId, userId, orderDto);
            return;
        }

        String url = "https://api.tosspayments.com/v1/payments/confirm";
        String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Basic " + auth);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentKey", confirmDto.getPaymentKey());
        body.put("orderId", confirmDto.getOrderId());
        body.put("amount", confirmDto.getAmount());

        try {
            Map<String, Object> response = externalApiService.post(url, body, headers, Map.class);

            String method = (String) response.get("method");
            String pgTid = (String) response.get("paymentKey");

            String pgProvider = "TOSS";
            if ("카드".equals(method)) {
                Map<String, Object> card = (Map<String, Object>) response.get("card");
                if (card != null) {
                    pgProvider = (String) card.get("issuerCode");
                }
            } else if (response.containsKey("easyPay")) {
                Map<String, Object> easyPay = (Map<String, Object>) response.get("easyPay");
                if (easyPay != null) {
                    pgProvider = (String) easyPay.get("provider");
                }
            }

            GroupOrderRequestDto orderDto = new GroupOrderRequestDto();
            orderDto.setOrderCount(1);
            orderDto.setPgProvider(pgProvider);
            orderDto.setPaymentMethod(method);
            orderDto.setPgTid(pgTid);

            participate(groupBuyId, userId, orderDto);

        } catch (Exception e) {
            throw new RuntimeException("결제 승인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteGroupPurchase(UUID id, UUID userId) {
        GroupPurchase groupPurchase = groupPurchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));

        if (!groupPurchase.getUser().getId().equals(userId)) {
            throw new RuntimeException("Only the creator can delete this group purchase.");
        }

        List<GroupOrder> orders = groupPurchase.getOrders();

        String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Basic " + auth);
        headers.put("Content-Type", "application/json");

        for (GroupOrder order : orders) {
            if (order.getPgTid() != null && !"KAKAO_PAY_MOCK".equals(order.getPgProvider())) {
                try {
                    log.info("Attempting refund for order {}: pgTid={}", order.getId(), order.getPgTid());

                    Map<String, String> body = new HashMap<>();
                    body.put("cancelReason", "공동구매 취소로 인한 자동 환불");

                    String cancelUrl = "https://api.tosspayments.com/v1/payments/" + order.getPgTid() + "/cancel";
                    externalApiService.post(cancelUrl, body, headers, String.class);

                    log.info("Successfully refunded order {}", order.getId());
                } catch (Exception e) {
                    log.error("Failed to refund order {}: {}", order.getId(), e.getMessage());
                }
            }
        }

        groupPurchaseRepository.delete(groupPurchase);
        log.info("Group purchase {} deleted by user {}", id, userId);
    }

    @Override
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredGroupPurchases() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(1);
        List<GroupPurchase> expiredItems = groupPurchaseRepository.findAllByEndDateBefore(threshold);

        if (!expiredItems.isEmpty()) {
            log.info("Cleaning up {} expired group purchases older than {}", expiredItems.size(), threshold);
            groupPurchaseRepository.deleteAll(expiredItems);
        }
    }

    private GroupPurchaseResponseDto convertToDto(GroupPurchase entity) {
        return GroupPurchaseResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .itemName(entity.getItemName())
                .itemPrice(entity.getItemPrice())
                .targetCount(entity.getTargetCount())
                .currentCount(entity.getCurrentCount())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .region(entity.getRegion())
                .creatorNickname(entity.getUser().getNickname())
                .creatorId(entity.getUser().getId())
                .build();
    }
}
