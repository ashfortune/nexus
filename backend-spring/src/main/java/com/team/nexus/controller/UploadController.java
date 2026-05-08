package com.team.nexus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Upload", description = "이미지 업로드 관련 API (Supabase Storage 통합)")
@Slf4j
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String supabaseBucket;

    private final RestTemplate restTemplate = new RestTemplate();

    @Operation(summary = "자유게시판 이미지 업로드")
    @PostMapping("/free")
    public ResponseEntity<Map<String, Object>> uploadFreeImages(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("community/free", files);
    }

    @Operation(summary = "지역별게시판 이미지 업로드")
    @PostMapping("/region")
    public ResponseEntity<Map<String, Object>> uploadRegionImages(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("community/region", files);
    }

    @Operation(summary = "업종별게시판 이미지 업로드")
    @PostMapping("/industry")
    public ResponseEntity<Map<String, Object>> uploadIndustryImages(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("community/industry", files);
    }

    @Operation(summary = "프로필 이미지 업로드")
    @PostMapping("/profiles")
    public ResponseEntity<Map<String, Object>> uploadProfileImages(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("profiles", files);
    }

    @Operation(summary = "공동구매 이미지 업로드")
    @PostMapping("/purchase")
    public ResponseEntity<Map<String, Object>> uploadPurchaseImages(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("group-purchase", files);
    }

    @Operation(summary = "채팅 파일 업로드")
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> uploadChatFiles(@RequestParam("files") List<MultipartFile> files) {
        return handleUpload("chat", files);
    }

    private ResponseEntity<Map<String, Object>> handleUpload(String folder, List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty())
                continue;

            try {
                String originalFilename = file.getOriginalFilename();
                String extension = ".jpg";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }

                String uniqueFilename = UUID.randomUUID().toString() + extension;
                String storagePath = folder + "/" + uniqueFilename;
                String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket,
                        storagePath);

                log.info("[Supabase Debug] Upload URL: {}", uploadUrl);
                log.info("[Supabase Debug] Bucket: {}", supabaseBucket);
                if (supabaseKey != null && supabaseKey.length() > 10) {
                    log.info("[Supabase Debug] Key Prefix: {}", supabaseKey.substring(0, 10));
                } else {
                    log.warn("[Supabase Debug] Key is null or too short!");
                }

                HttpHeaders headers = new HttpHeaders();
                headers.set("apikey", supabaseKey);
                headers.set("Authorization", "Bearer " + supabaseKey);
                headers.setContentType(
                        MediaType.valueOf(file.getContentType() != null ? file.getContentType() : "image/jpeg"));

                HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
                ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, entity,
                        String.class);

                if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                    urls.add(String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket,
                            storagePath));
                }
            } catch (Exception e) {
                log.error("Upload failed for file: {}", file.getOriginalFilename(), e);
            }
        }

        if (!files.isEmpty() && urls.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "파일 업로드에 실패했습니다. 설정을 확인해 주세요."
            ));
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", urls.size() + "개의 파일이 업로드되었습니다.",
                "urls", urls));
    }
}
