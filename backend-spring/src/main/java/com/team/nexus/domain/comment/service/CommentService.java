package com.team.nexus.domain.comment.service;

import com.team.nexus.domain.comment.dto.CommentCreateRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import java.util.List;
import java.util.UUID;

public interface CommentService {
    List<CommentResponseDto> getComments(UUID boardId);
    void createComment(UUID boardId, CommentCreateRequestDto requestDto, String email);
    void deleteComment(UUID commentId, String email);
    void updateComment(UUID commentId, String content, String email);
    int reportComment(UUID commentId);
}
