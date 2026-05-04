package com.team.nexus.domain.grouppurchase.controller;

import com.team.nexus.domain.grouppurchase.service.GroupPurchaseFileService;
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
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@Tag(name = "Group Purchase File", description = "공동구매 파일 업로드 및 조회 API")
@RestController
@RequestMapping("/api/v1/group-purchases/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class GroupPurchaseFileController {

    private final GroupPurchaseFileService groupPurchaseFileService;

    @Operation(summary = "파일 업로드", description = "공동구매 관련 파일을 업로드합니다.")
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category) {
        String fileUrl = groupPurchaseFileService.uploadFile(file, category);
        return ResponseEntity.ok(Map.of("url", "http://localhost:8080" + fileUrl));
    }

    @Operation(summary = "파일 표시", description = "업로드된 파일을 브라우저에 표시합니다.")
    @GetMapping("/display/{*fileName}")
    public ResponseEntity<Resource> displayFile(@PathVariable String fileName) {
        try {
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads").resolve(cleanPath).normalize();
            
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
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error displaying group purchase file: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "파일 다운로드", description = "업로드된 파일을 다운로드합니다.")
    @GetMapping("/download/{*fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads").resolve(cleanPath).normalize();
            
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                String originalName = path.getFileName().toString();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error downloading group purchase file: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
