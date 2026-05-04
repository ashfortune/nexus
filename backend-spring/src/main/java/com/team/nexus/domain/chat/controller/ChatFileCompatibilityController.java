package com.team.nexus.domain.chat.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Tag(name = "Chat File Compatibility", description = "구 버전 파일 경로 호환성 API")
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class ChatFileCompatibilityController {

    @Operation(summary = "구 버전 파일 표시 호환성", description = "/api/v1/files 경로로 저장된 이전 파일들을 표시합니다.")
    @GetMapping("/api/v1/files/display/{*fileName}")
    public ResponseEntity<Resource> displayOldFile(@PathVariable String fileName) {
        try {
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads").resolve(cleanPath).normalize();
            
            log.info("Attempting to display old file: {}", path.toAbsolutePath());

            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                String name = path.getFileName().toString().toLowerCase();
                
                if (name.endsWith(".png")) contentType = "image/png";
                else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (name.endsWith(".gif")) contentType = "image/gif";
                else if (name.endsWith(".webp")) contentType = "image/webp";

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                log.warn("Old file not found: {}", path.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error displaying old file: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "구 버전 파일 다운로드 호환성", description = "/api/v1/files 경로로 저장된 이전 파일들을 다운로드합니다.")
    @GetMapping("/api/v1/files/download/{*fileName}")
    public ResponseEntity<Resource> downloadOldFile(@PathVariable String fileName) {
        try {
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads").resolve(cleanPath).normalize();
            
            log.info("Attempting to download old file: {}", path.toAbsolutePath());

            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                String originalName = path.getFileName().toString();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                        .body(resource);
            } else {
                log.warn("Old file not found for download: {}", path.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error downloading old file: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
