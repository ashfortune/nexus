package com.team.nexus.domain.grouppurchase.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class GroupPurchaseFileServiceImpl implements GroupPurchaseFileService {

    @Override
    public String uploadFile(MultipartFile file, String category) {
        // 이 메서드는 더 이상 직접 로컬에 저장하지 않습니다.
        // 프론트엔드에서 UploadController를 통해 Supabase URL을 받아와야 합니다.
        throw new UnsupportedOperationException("대신 UploadController를 사용하고 URL을 직접 저장하세요.");
    }
}
