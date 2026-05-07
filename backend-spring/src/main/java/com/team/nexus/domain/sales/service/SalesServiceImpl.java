package com.team.nexus.domain.sales.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.sales.dto.SalesDataDTO;
import com.team.nexus.domain.sales.repository.SaleRepository;
import com.team.nexus.global.entity.Sale;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesServiceImpl implements SalesService {

    private final SaleRepository saleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void saveOrUpdateSales(UUID userId, List<SalesDataDTO> dataList) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        log.info("매출 데이터 저장 시작: 사용자={}, 데이터 건수={}", userId, dataList.size());

        for (SalesDataDTO data : dataList) {
            if (data.getDate() == null) {
                log.warn("날짜 데이터가 누락되었습니다. 건너뜁니다: {}", data);
                continue;
            }

            LocalDate salesDate = data.getDate();
            
            // 덮어쓰기 로직: 기존 데이터 존재 여부 확인
            Sale sale = saleRepository.findByUserAndSalesDate(user, salesDate)
                    .orElseGet(() -> {
                        log.debug("새로운 매출 레코드 생성: {}", salesDate);
                        return new Sale();
                    });

            sale.setUser(user);
            sale.setSalesDate(salesDate);
            sale.setTotalAmount(data.getSales());
            sale.setStoreNumber("MANUAL_INPUT");
            
            log.debug("저장 전 Sale 객체 상태: user={}, date={}, amount={}", 
                sale.getUser().getId(), sale.getSalesDate(), sale.getTotalAmount());
            
            Sale saved = saleRepository.save(sale);
            log.debug("저장 완료된 Sale ID: {}", saved.getId());
        }
        log.info("매출 데이터 저장 프로세스 완료");
    }

    @Override
    public List<SalesDataDTO> parseCsv(MultipartFile file) {
        List<SalesDataDTO> dataList = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                
                String[] columns = line.split(",");
                if (columns.length < 2) continue;

                // 헤더 스킵 (첫 번째 행이 숫자가 아니면 헤더로 간주)
                if (isHeader) {
                    isHeader = false;
                    if (!columns[0].matches(".*\\d.*")) continue;
                }

                try {
                    LocalDate date = LocalDate.parse(columns[0].trim(), DateTimeFormatter.ISO_DATE);
                    Integer sales = Integer.parseInt(columns[1].trim());
                    dataList.add(new SalesDataDTO(date, sales));
                } catch (Exception e) {
                    log.warn("CSV 파싱 오류 (행 건너뜀): {}", line);
                }
            }
        } catch (Exception e) {
            log.error("CSV 파일 읽기 실패", e);
            throw new RuntimeException("CSV 파일 처리에 실패했습니다.");
        }
        return dataList;
    }
}
