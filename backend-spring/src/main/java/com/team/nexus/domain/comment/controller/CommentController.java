package com.team.nexus.domain.comment.controller;

import com.team.nexus.domain.comment.dto.CommentCreateRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import com.team.nexus.domain.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Comment", description = "댓글 관련 API")
@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "게시글 댓글 조회", description = "게시글의 모든 댓글을 계층형으로 조회합니다.")
    @GetMapping("/{boardId}")
    public ResponseEntity<Map<String, Object>> getComments(@PathVariable UUID boardId) {
        List<CommentResponseDto> comments = commentService.getComments(boardId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", comments);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "댓글 작성", description = "게시글에 댓글 또는 대댓글을 작성합니다.")
    @PostMapping("/{boardId}")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable UUID boardId,
            @RequestBody CommentCreateRequestDto requestDto,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            commentService.createComment(boardId, requestDto, email);
            response.put("status", "success");
            response.put("message", "댓글이 등록되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "댓글 수정", description = "자신의 댓글을 수정합니다.")
    @PutMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable UUID commentId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            commentService.updateComment(commentId, requestBody.get("content"), email);
            response.put("status", "success");
            response.put("message", "댓글이 수정되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "댓글 삭제", description = "자신의 댓글을 삭제 처리합니다.")
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            commentService.deleteComment(commentId, email);
            response.put("status", "success");
            response.put("message", "댓글이 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "댓글 신고", description = "특정 댓글을 신고합니다.")
    @PostMapping("/report/{commentId}")
    public ResponseEntity<Map<String, Object>> reportComment(@PathVariable UUID commentId) {
        Map<String, Object> response = new HashMap<>();
        try {
            int currentCount = commentService.reportComment(commentId);
            response.put("status", "success");
            response.put("reportCount", currentCount);
            response.put("message", currentCount >= 3 ? "신고 누적으로 댓글이 삭제되었습니다." : "신고가 접수되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
