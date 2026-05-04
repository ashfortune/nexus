package com.team.nexus.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Component
public class SupabaseStorageUtil {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final WebClient webClient;

    public SupabaseStorageUtil(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * 파일을 Supabase Storage에 업로드합니다.
     *
     * @param file   업로드할 파일
     * @param folder 저장할 폴더 (예: chat, group-purchases)
     * @return 업로드된 파일의 Public URL
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains(".")) ? 
                               originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            // Supabase Storage 업로드 경로: bucket/folder/filename
            String uploadPath = folder + "/" + savedFilename;
            String apiUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, uploadPath);

            log.info("Uploading file to Supabase: {}", apiUrl);

            byte[] fileBytes = file.getBytes();

            webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .header("apikey", supabaseKey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .bodyValue(fileBytes)
                    .retrieve()
                    .onStatus(status -> status.isError(), response -> 
                        response.bodyToMono(String.class).flatMap(errorBody -> {
                            log.error("Supabase upload error: {}", errorBody);
                            return Mono.error(new RuntimeException("Supabase upload failed: " + errorBody));
                        })
                    )
                    .toBodilessEntity()
                    .block();

            // 업로드 성공 후 Public URL 반환
            // 형식: {supabaseUrl}/storage/v1/object/public/{bucketName}/{uploadPath}
            return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, uploadPath);

        } catch (Exception e) {
            log.error("Error occurred during Supabase file upload", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }
    }
}
