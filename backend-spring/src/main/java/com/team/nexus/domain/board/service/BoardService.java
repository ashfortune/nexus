package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.dto.BoardUpdateRequestDto;
import com.team.nexus.global.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface BoardService {
    // --- 자유게시판 (Free Board) ---
    Page<BoardResponseDto> getBoardList(int page, int size);
    Page<BoardResponseDto> searchPosts(String keyword, String type, int page, int size);
    
    // --- 지역별 게시판 (Region Board) ---
    Page<BoardResponseDto> getRegionBoardList(String region, int page, int size);
    Page<BoardResponseDto> searchRegionPosts(String region, String keyword, String type, int page, int size);
    Page<BoardResponseDto> getIndustryBoardList(UUID categoryId, int page, int size);
    Page<BoardResponseDto> searchIndustryPosts(UUID categoryId, String keyword, String type, int page, int size);
    
    List<BoardResponseDto> getTopPosts();
    List<BoardResponseDto> getRegionTopPosts(String region);
    BoardResponseDto getPostDetail(UUID id);
    BoardResponseDto getPostDetail(UUID id, boolean incrementView);
    Page<BoardResponseDto> getPopularPosts(int page, int size);
    Page<BoardResponseDto> getRegionPopularPosts(String region, int page, int size);
    void createPost(BoardCreateRequestDto requestDto, User user);
    void deletePost(UUID id, String email);
    BoardResponseDto updatePost(UUID id, BoardUpdateRequestDto request, String email);
    
    // --- 좋아요 기능 ---
    boolean toggleLike(UUID boardId, String email);
    boolean isLiked(UUID boardId, String email);
}
