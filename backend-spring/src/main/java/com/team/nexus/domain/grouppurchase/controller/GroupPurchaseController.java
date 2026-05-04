package com.team.nexus.domain.grouppurchase.controller;

import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.service.GroupPurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Tag(name = "GroupPurchase", description = "공동구매 관리 API")
@RestController
@RequestMapping("/api/v1/group-purchases")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GroupPurchaseController {

    private final GroupPurchaseService groupPurchaseService;

    @Operation(summary = "공동구매 등록", description = "새로운 공동구매 항목을 등록합니다.")
    @PostMapping
    public ResponseEntity<GroupPurchaseResponseDto> createGroupPurchase(
            @RequestBody GroupPurchaseRequestDto requestDto,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(groupPurchaseService.createGroupPurchase(requestDto, userId));
    }

    @Operation(summary = "공동구매 목록 조회", description = "전체 공동구매 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<List<GroupPurchaseResponseDto>> getAllGroupPurchases() {
        return ResponseEntity.ok(groupPurchaseService.getAllGroupPurchases());
    }

    @Operation(summary = "공동구매 검색 및 필터링", description = "물품명 또는 지역으로 공동구매를 검색합니다.")
    @GetMapping("/search")
    public ResponseEntity<List<GroupPurchaseResponseDto>> searchGroupPurchases(
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(groupPurchaseService.searchGroupPurchases(itemName, region));
    }

    @Operation(summary = "공동구매 상세 조회", description = "특정 공동구매 항목의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<GroupPurchaseResponseDto> getGroupPurchase(@PathVariable UUID id) {
        return ResponseEntity.ok(groupPurchaseService.getGroupPurchase(id));
    }

    @Operation(summary = "공동구매 삭제 및 환불", description = "공동구매를 취소하고 참여자들에게 일괄 환불을 진행합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroupPurchase(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        groupPurchaseService.deleteGroupPurchase(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "참여 여부 확인", description = "사용자가 해당 공동구매에 이미 참여했는지 확인합니다.")
    @GetMapping("/{id}/check-participation")
    public ResponseEntity<Boolean> checkParticipation(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(groupPurchaseService.checkParticipation(id, userId));
    }

    @Operation(summary = "공동구매 참여(결제)", description = "특정 공동구매에 참여하고 결제 정보를 기록합니다.")
    @PostMapping("/{id}/participate")
    public ResponseEntity<Void> participate(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestBody com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto orderDto) {
        groupPurchaseService.participate(id, userId, orderDto);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "결제 승인 및 참여 확정", description = "토스 페이먼츠 결제 승인을 거쳐 참여를 확정합니다.")
    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<Void> confirmPayment(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestBody com.team.nexus.domain.grouppurchase.dto.PaymentConfirmRequestDto confirmDto) {
        groupPurchaseService.confirmPayment(id, userId, confirmDto);
        return ResponseEntity.ok().build();
    }
}
