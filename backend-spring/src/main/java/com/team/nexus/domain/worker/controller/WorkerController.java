package com.team.nexus.domain.worker.controller;

import com.team.nexus.domain.worker.dto.LaborContractRequestDto;
import com.team.nexus.domain.worker.dto.WorkerRequestDto;
import com.team.nexus.domain.worker.dto.WorkerResponseDto;
import com.team.nexus.domain.worker.service.LaborContractService;
import com.team.nexus.domain.worker.service.WorkerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/worker")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;
    private final LaborContractService laborContractService;

    @PostMapping("/calculate")
    public ResponseEntity<WorkerResponseDto> calculate(
            @RequestBody WorkerRequestDto request) {
        return ResponseEntity.ok(workerService.calculate(request));
    }

    @PostMapping("/contract/pdf")
    public ResponseEntity<byte[]> generateContract(
            @RequestBody LaborContractRequestDto request) throws Exception {
        byte[] pdf = laborContractService.generateContract(request);

        String encodedFilename = UriUtils.encode("근로계약서.pdf", StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"contract.pdf\"; filename*=UTF-8''" + encodedFilename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}