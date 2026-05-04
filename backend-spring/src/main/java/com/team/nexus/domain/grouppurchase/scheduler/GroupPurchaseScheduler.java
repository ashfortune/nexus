package com.team.nexus.domain.grouppurchase.scheduler;

import com.team.nexus.domain.grouppurchase.repository.GroupOrderRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.global.entity.GroupOrder;
import com.team.nexus.global.entity.GroupPurchase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class GroupPurchaseScheduler {

    private final GroupPurchaseRepository groupPurchaseRepository;
    private final GroupOrderRepository groupOrderRepository;

    /**
     * 매시간 정각마다 마감된 공동구매를 체크하여 실패 시 환불 처리
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void processExpiredGroupBuys() {
        log.info("Starting expired group buy check at {}", LocalDateTime.now());
        
        // 1. 마감시간은 지났는데 상태가 아직 RECRUITING인 것들 찾기
        List<GroupPurchase> expiredList = groupPurchaseRepository.findAllByStatusAndEndDateBefore(
                "RECRUITING", LocalDateTime.now());

        for (GroupPurchase gp : expiredList) {
            if (gp.getCurrentCount() < gp.getTargetCount()) {
                log.info("Group buy {} failed to reach target. Processing refunds...", gp.getId());
                processRefunds(gp);
                gp.setStatus("FAILED");
            } else {
                log.info("Group buy {} reached target successfully.", gp.getId());
                gp.setStatus("SUCCESS");
            }
            groupPurchaseRepository.save(gp);
        }
    }

    private void processRefunds(GroupPurchase gp) {
        // 해당 공동구매에 속한 모든 주문 찾기
        List<GroupOrder> orders = groupOrderRepository.findAllByGroupPurchaseId(gp.getId());
        
        for (GroupOrder order : orders) {
            try {
                // TODO: 실제 PG사(토스/카카오페이) 환불 API 호출 로직이 들어갈 자리
                log.info("Refunding order {} for user {} via {}", order.getId(), order.getUser().getId(), order.getPgProvider());
                
                // 가상의 환불 성공 처리
                order.setPaymentStatus("REFUNDED");
                groupOrderRepository.save(order);
                
            } catch (Exception e) {
                log.error("Failed to refund order {}: {}", order.getId(), e.getMessage());
            }
        }
    }
}
