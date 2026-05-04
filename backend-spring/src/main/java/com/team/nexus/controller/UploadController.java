package com.team.nexus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Upload", description = "이미지 업로드 관련 API (Supabase Storage)")
@Slf4j
@RestController
@RequestMapping("/api/v1/upload")
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
        return uploadToSupabase("community/free", files);
    }

    @Operation(summary = "지역별게시판 이미지 업로드")
    @PostMapping("/region")
    public ResponseEntity<Map<String, Object>> uploadRegionImages(@RequestParam("files") List<MultipartFile> files) {
        return uploadToSupabase("community/region", files);
    }

    @Operation(summary = "업종별게시판 이미지 업로드")
    @PostMapping("/industry")
    public ResponseEntity<Map<String, Object>> uploadIndustryImages(@RequestParam("files") List<MultipartFile> files) {
        return uploadToSupabase("community/industry", files);
    }

    @Operation(summary = "프로필 이미지 업로드")
    @PostMapping("/profiles")
    public ResponseEntity<Map<String, Object>> uploadProfileImages(@RequestParam("files") List<MultipartFile> files) {
        return uploadToSupabase("profiles", files);
    }

    @Operation(summary = "공동구매 이미지 업로드")
    @PostMapping("/purchase")
    public ResponseEntity<Map<String, Object>> uploadPurchaseImages(@RequestParam("files") List<MultipartFile> files) {
        return uploadToSupabase("group-purchase", files);
    }

    private ResponseEntity<Map<String, Object>> uploadToSupabase(String folder, List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();
        
        try {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                
                String uniqueFilename = UUID.randomUUID().toString() + extension;
                String storagePath = folder + "/" + uniqueFilename;
                
                String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, storagePath);
                log.info("Uploading to Supabase: {}", uploadUrl);

                HttpHeaders headers = new HttpHeaders();
                headers.set("apikey", supabaseKey);
                headers.set("Authorization", "Bearer " + supabaseKey);
                headers.set("x-upsert", "true");
                headers.setContentType(MediaType.valueOf(file.getContentType() != null ? file.getContentType() : "image/jpeg"));

                HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
                
                try {
                    ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);
                    log.info("Supabase Response: {} - {}", response.getStatusCode(), response.getBody());

                    if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                        String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, storagePath);
                        urls.add(publicUrl);
                    }
                } catch (org.springframework.web.client.HttpStatusCodeException e) {
                    log.error("Supabase API Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                    throw e;
                }
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", urls.size() + "개의 이미지가 Supabase " + folder + " 폴더에 업로드되었습니다.",
                "urls", urls
            ));

        } catch (Exception e) {
            log.error("Total Upload Process Failed", e);
            // 에러 원인을 브라우저에 직접 노출하여 확인 (디버깅 완료 후 제거 권장)
            String errorMessage = e.getMessage();
            if (e instanceof org.springframework.web.client.HttpStatusCodeException) {
                errorMessage = ((org.springframework.web.client.HttpStatusCodeException) e).getResponseBodyAsString();
            }
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "업로드 중 오류 발생: " + errorMessage,
                "trace", e.toString()
            ));
        }
    }
}
