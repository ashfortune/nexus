package com.team.nexus.domain.chat.service;

import com.team.nexus.global.util.SupabaseStorageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatFileServiceImpl implements ChatFileService {

    @Value("${supabase.storage-type:LOCAL}")
    private String storageType;

    private final SupabaseStorageUtil supabaseStorageUtil;
    private final String uploadPath = "uploads/";

    @Override
    public String uploadFile(MultipartFile file, String category) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        // 설정에 따라 저장 방식 선택
        if ("SUPABASE".equalsIgnoreCase(storageType)) {
            return uploadToSupabase(file, category);
        } else {
            return uploadToLocal(file, category);
        }
    }

    private String uploadToSupabase(MultipartFile file, String category) {
        try {
            String folder = "chat";
            if (category != null && !category.isEmpty()) {
                folder += "/" + category;
            }
            String publicUrl = supabaseStorageUtil.uploadFile(file, folder);
            log.info("File uploaded successfully to Supabase: {}", publicUrl);
            return publicUrl;
        } catch (Exception e) {
            log.error("Failed to upload to Supabase", e);
            throw new RuntimeException("Supabase 업로드 중 오류 발생");
        }
    }

    private String uploadToLocal(MultipartFile file, String category) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains(".")) ? 
                               originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            Path rootPath = Paths.get(uploadPath).toAbsolutePath().normalize();
            Path targetDir = (category != null && !category.isEmpty()) ? rootPath.resolve(category) : rootPath;
            
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            
            Path filePath = targetDir.resolve(savedFilename);
            Files.write(filePath, file.getBytes());
            
            log.info("File uploaded successfully to local: {}", filePath);
            String subPath = (category != null && !category.isEmpty()) ? category + "/" : "";
            return "/api/v1/chat/files/display/" + subPath + savedFilename;
        } catch (IOException e) {
            log.error("Failed to upload to local", e);
            throw new RuntimeException("로컬 업로드 중 오류 발생");
        }
    }
}
