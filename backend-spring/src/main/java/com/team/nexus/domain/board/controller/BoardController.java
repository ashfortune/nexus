package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.dto.BoardUpdateRequestDto;
import com.team.nexus.domain.board.service.BoardService;
import com.team.nexus.domain.board.service.IndustryCategoryService;
import com.team.nexus.global.entity.User;
import com.team.nexus.domain.auth.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Board", description = "통합 게시판 관련 API (자유/지역/업종)")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final UserRepository userRepository;
    private final IndustryCategoryService industryCategoryService;

    // ==========================================
    // 0. 카테고리 관리 (Industry Categories)
    // ==========================================

    @Operation(summary = "메인 업종 카테고리 조회", description = "최상위 업종 카테고리 목록을 조회합니다.")
    @GetMapping("/industry-categories/main")
    public ResponseEntity<Map<String, Object>> getMainCategories() {
        return ResponseEntity.ok(Map.of("status", "success", "data", industryCategoryService.getMainCategories()));
    }

    @Operation(summary = "서브 업종 카테고리 조회", description = "특정 카테고리의 하위 카테고리 목록을 조회합니다.")
    @GetMapping("/industry-categories/sub/{parentId}")
    public ResponseEntity<Map<String, Object>> getSubCategories(@PathVariable UUID parentId) {
        return ResponseEntity.ok(Map.of("status", "success", "data", industryCategoryService.getSubCategories(parentId)));
    }

    // ==========================================
    // 1. 자유 게시판 (General Board)
    // ==========================================

    @Operation(summary = "자유게시판 목록 조회", description = "자유게시판의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping("/board")
    public ResponseEntity<Map<String, Object>> getBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchPosts(keyword, type, page, size);
        } else {
            boardPage = boardService.getBoardList(page, size);
        }
        
        return ResponseEntity.ok(createPagedResponse(boardPage));
    }

    @Operation(summary = "인기 게시글 목록 조회", description = "자유게시판의 인기 게시글(좋아요 10개 이상) 목록을 페이징하여 조회합니다.")
    @GetMapping("/board/popular")
    public ResponseEntity<Map<String, Object>> getPopularBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<BoardResponseDto> boardPage = boardService.getPopularPosts(page, size);
        return ResponseEntity.ok(createPagedResponse(boardPage));
    }

    @Operation(summary = "조회수 상위 게시글 조회", description = "자유게시판의 조회수 상위 3개 게시글을 조회합니다.")
    @GetMapping("/board/top")
    public ResponseEntity<Map<String, Object>> getTopBoardList() {
        return ResponseEntity.ok(Map.of("status", "success", "data", boardService.getTopPosts()));
    }

    // ==========================================
    // 2. 지역별 게시판 (Region Board)
    // ==========================================

    @Operation(summary = "지역별 게시글 목록 조회", description = "특정 지역의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping("/region-board")
    public ResponseEntity<Map<String, Object>> getRegionBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam String region) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchRegionPosts(region, keyword, type, page, size);
        } else {
            boardPage = boardService.getRegionBoardList(region, page, size);
        }
        
        return ResponseEntity.ok(createPagedResponse(boardPage));
    }

    @Operation(summary = "지역별 인기 게시글 목록 조회", description = "특정 지역의 인기 게시글(좋아요 10개 이상) 목록을 페이징하여 조회합니다.")
    @GetMapping("/region-board/popular")
    public ResponseEntity<Map<String, Object>> getRegionPopularBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String region) {
        
        Page<BoardResponseDto> boardPage = boardService.getRegionPopularPosts(region, page, size);
        return ResponseEntity.ok(createPagedResponse(boardPage));
    }

    @Operation(summary = "지역별 조회수 TOP 3 게시글 조회", description = "특정 지역에서 조회수가 가장 높은 상위 3개 게시글을 조회합니다.")
    @GetMapping("/region-board/top")
    public ResponseEntity<Map<String, Object>> getRegionTopBoardList(@RequestParam String region) {
        return ResponseEntity.ok(Map.of("status", "success", "data", boardService.getRegionTopPosts(region)));
    }

    // ==========================================
    // 3. 업종별 게시판 (Industry Board)
    // ==========================================

    @Operation(summary = "업종별 게시글 목록 조회", description = "특정 업종의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping("/industry-board/{categoryId}")
    public ResponseEntity<Map<String, Object>> getIndustryBoardList(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchIndustryPosts(categoryId, keyword, type, page, size);
        } else {
            boardPage = boardService.getIndustryBoardList(categoryId, page, size);
        }
        
        return ResponseEntity.ok(createPagedResponse(boardPage));
    }

    // ==========================================
    // 4. 공통 기능 (CRUD & Actions)
    // ==========================================

    @Operation(summary = "게시글 작성", description = "게시판에 새로운 게시글을 작성합니다. (자유/지역/업종 통합)")
    @PostMapping("/board")
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody BoardCreateRequestDto requestDto,
            @AuthenticationPrincipal String email) {
        
        try {
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("status", "error", "message", "로그인이 필요합니다."));
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            boardService.createPost(requestDto, user);
            
            return ResponseEntity.ok(Map.of("status", "success", "message", "게시글이 작성되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @Operation(summary = "게시글 상세 조회", description = "게시글의 상세 내용을 조회합니다.")
    @GetMapping("/board/{id}")
    public ResponseEntity<Map<String, Object>> getPostDetail(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean silent) {
        BoardResponseDto postDetail = boardService.getPostDetail(id, !silent);
        return ResponseEntity.ok(Map.of("status", "success", "data", postDetail));
    }

    @Operation(summary = "게시글 수정", description = "게시글을 수정합니다.")
    @PutMapping("/board/{id}")
    public ResponseEntity<Map<String, Object>> updatePost(
            @PathVariable UUID id,
            @RequestBody BoardUpdateRequestDto requestDto,
            @AuthenticationPrincipal String email) {
        
        try {
            BoardResponseDto updatedPost = boardService.updatePost(id, requestDto, email);
            return ResponseEntity.ok(Map.of("status", "success", "data", updatedPost));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @Operation(summary = "게시글 삭제", description = "게시글을 삭제합니다.")
    @DeleteMapping("/board/{id}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        try {
            boardService.deletePost(id, email);
            return ResponseEntity.ok(Map.of("status", "success", "message", "게시글이 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @Operation(summary = "게시글 좋아요 토글", description = "게시글에 좋아요를 누르거나 취소합니다.")
    @PostMapping("/board/like/{id}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        try {
            boolean isLiked = boardService.toggleLike(id, email);
            return ResponseEntity.ok(Map.of("status", "success", "isLiked", isLiked));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @Operation(summary = "게시글 좋아요 상태 확인", description = "현재 사용자의 게시글 좋아요 여부를 확인합니다.")
    @GetMapping("/board/like/{id}/status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        try {
            boolean isLiked = boardService.isLiked(id, email);
            return ResponseEntity.ok(Map.of("status", "success", "isLiked", isLiked));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // Paged Response Helper
    private Map<String, Object> createPagedResponse(Page<BoardResponseDto> boardPage) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        return response;
    }
}
