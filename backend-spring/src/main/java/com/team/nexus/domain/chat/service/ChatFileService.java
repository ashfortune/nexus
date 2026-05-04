package com.team.nexus.domain.chat.service;

import org.springframework.web.multipart.MultipartFile;

public interface ChatFileService {
    /**
     * 파일을 업로드하고 브라우저에서 접근 가능한 URL을 반환합니다.
     * 
     * @param file     업로드할 파일
     * @param category 파일 분류 (예: chat-rooms, chat-messages)
     * @return 파일 접근 URL
     */
    String uploadFile(MultipartFile file, String category);
}
