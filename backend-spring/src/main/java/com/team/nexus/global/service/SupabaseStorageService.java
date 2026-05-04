package com.team.nexus.global.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String supabaseBucket;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFile(String folder, MultipartFile file) {
        if (file.isEmpty()) return null;

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID().toString() + extension;
            String storagePath = folder + "/" + uniqueFilename;

            String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, storagePath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("x-upsert", "true");
            headers.setContentType(MediaType.valueOf(file.getContentType() != null ? file.getContentType() : "image/jpeg"));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            
            ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, storagePath);
            }
        } catch (Exception e) {
            log.error("Supabase upload failed for folder: {}", folder, e);
        }
        return null;
    }

    public List<String> uploadFiles(String folder, List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = uploadFile(folder, file);
            if (url != null) urls.add(url);
        }
        return urls;
    }
}
