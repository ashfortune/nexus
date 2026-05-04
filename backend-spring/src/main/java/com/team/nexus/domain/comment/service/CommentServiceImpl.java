package com.team.nexus.domain.comment.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.domain.comment.dto.CommentCreateRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import com.team.nexus.domain.comment.repository.CommentRepository;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.Comment;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getComments(UUID boardId) {
        List<Comment> comments = commentRepository.findByBoardIdAndParentIsNullOrderByCreatedAtAsc(boardId);
        return comments.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createComment(UUID boardId, CommentCreateRequestDto requestDto, String email) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment parent = null;
        if (requestDto.getParentId() != null && !requestDto.getParentId().trim().isEmpty()) {
            try {
                parent = commentRepository.findById(UUID.fromString(requestDto.getParentId()))
                        .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 부모 댓글 ID입니다.");
            }
        }

        Comment comment = Comment.builder()
                .board(board)
                .user(user)
                .content(requestDto.getContent())
                .parent(parent)
                .build();

        commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("자신의 댓글만 삭제할 수 있습니다.");
        }

        // 실제 삭제 대신 내용 변경 (대댓글 유지를 위해)
        comment.setContent("삭제된 댓글입니다.");
        commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void updateComment(UUID commentId, String content, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("자신의 댓글만 수정할 수 있습니다.");
        }

        comment.setContent(content);
        commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void reportComment(UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        
        int newCount = comment.getReportCount() + 1;
        comment.setReportCount(newCount);
        
        // 신고 3회 이상 시 자동 삭제 처리
        if (newCount >= 3) {
            comment.setContent("신고 누적으로 삭제된 댓글입니다.");
        }
        
        commentRepository.save(comment);
    }

    private CommentResponseDto convertToDto(Comment comment) {
        return CommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(comment.getUser() != null ? comment.getUser().getNickname() : "알 수 없음")
                .authorId(comment.getUser() != null ? comment.getUser().getId() : null)
                .createdAt(comment.getCreatedAt())
                .reportCount(comment.getReportCount())
                .children(comment.getChildren().stream().map(this::convertToDto).collect(Collectors.toList()))
                .build();
    }
}
