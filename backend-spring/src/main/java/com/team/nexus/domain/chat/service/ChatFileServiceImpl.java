package com.team.nexus.domain.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class ChatFileServiceImpl implements ChatFileService {

    private final String uploadPath = "uploads/";

    public ChatFileServiceImpl() {
        // 업로드 루트 폴더 생성
        File directory = new File(uploadPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String category) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            // 카테고리(폴더) 경로 설정
            Path rootPath = Paths.get(uploadPath).toAbsolutePath().normalize();
            Path targetDir = (category != null && !category.isEmpty()) ? rootPath.resolve(category) : rootPath;
            
            // 폴더가 없으면 생성
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            Path filePath = targetDir.resolve(savedFilename);
            
            Files.write(filePath, file.getBytes());
            log.info("File uploaded successfully to: {}", filePath);
            
            // 브라우저에서 접근 가능한 URL 경로 반환
            String subPath = (category != null && !category.isEmpty()) ? category + "/" : "";
            return "/api/v1/chat/files/display/" + subPath + savedFilename;
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.");
        }
    }
}
