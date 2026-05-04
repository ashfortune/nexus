package com.team.nexus.domain.board.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.dto.BoardUpdateRequestDto;
import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.domain.comment.repository.CommentRepository;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.BoardImage;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final com.team.nexus.domain.board.repository.BoardLikeRepository boardLikeRepository;
    private final com.team.nexus.domain.license.repository.IndustryCategoryRepository industryCategoryRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getBoardList(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findFreeBoards(pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> searchPosts(String keyword, String type, int page, int size) {
        String trimmedKeyword = (keyword != null) ? keyword.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Board> boards;
        
        if ("title".equals(type)) {
            boards = boardRepository.findFreeBoardByTitle(trimmedKeyword, pageable);
        } else if ("author".equals(type)) {
            boards = boardRepository.findFreeBoardByPublicUserNickname(trimmedKeyword, pageable);
        } else {
            boards = boardRepository.findFreeBoardByKeywordAll(trimmedKeyword, pageable);
        }
        
        return boards.map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getRegionBoardList(String region, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findByRegionNameOrderByCreatedAtDesc(region, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> searchRegionPosts(String region, String keyword, String type, int page, int size) {
        String trimmedKeyword = (keyword != null) ? keyword.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Board> boards;
        
        if ("title".equals(type)) {
            boards = boardRepository.findByRegionNameAndTitleContainingOrderByCreatedAtDesc(region, trimmedKeyword, pageable);
        } else if ("author".equals(type)) {
            boards = boardRepository.findByRegionNameAndPublicUserNickname(region, trimmedKeyword, pageable);
        } else {
            boards = boardRepository.findByRegionNameAndKeywordAll(region, trimmedKeyword, pageable);
        }
        
        return boards.map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getIndustryBoardList(UUID categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findByIndustryCategoryId(categoryId, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> searchIndustryPosts(UUID categoryId, String keyword, String type, int page, int size) {
        String trimmedKeyword = (keyword != null) ? keyword.trim() : "";
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findByIndustryCategoryIdAndKeywordAll(categoryId, trimmedKeyword, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDto> getTopPosts() {
        return boardRepository.findTop3ByOrderByViewCountDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDto> getRegionTopPosts(String region) {
        return boardRepository.findTop3ByRegionNameOrderByViewCountDesc(region).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BoardResponseDto getPostDetail(UUID id) {
        return getPostDetail(id, true);
    }

    @Override
    @Transactional
    public BoardResponseDto getPostDetail(UUID id, boolean incrementView) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        if (incrementView) {
            // 조회수 증가
            board.setViewCount((board.getViewCount() == null ? 0 : board.getViewCount()) + 1);
        }
        
        return convertToDto(board);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getPopularPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findAllByLikeCountGreaterThanEqual(10, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getRegionPopularPosts(String region, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return boardRepository.findByRegionNameAndLikeCountGreaterThanEqual(region, 10, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional
    public void createPost(BoardCreateRequestDto requestDto, User user) {
        // 업종별 게시판인 경우 업종 카테고리 필수 체크
        if ("INDUSTRY".equals(requestDto.getCategoryName())) {
            if (requestDto.getIndustryCategoryId() == null || requestDto.getIndustryCategoryId().isEmpty()) {
                throw new IllegalArgumentException("업종을 선택해야 합니다.");
            }
        }

        Board board = Board.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .regionName(requestDto.getRegionName())
                .categoryName(requestDto.getCategoryName())
                .isAnonymous(requestDto.getIsAnonymous() != null && requestDto.getIsAnonymous())
                .viewCount(0)
                .user(user)
                .build();
        
        if (requestDto.getIndustryCategoryId() != null && !requestDto.getIndustryCategoryId().isEmpty()) {
            industryCategoryRepository.findById(UUID.fromString(requestDto.getIndustryCategoryId()))
                    .ifPresent(board::setIndustryCategory);
        }
        
        if (requestDto.getImageUrls() != null && !requestDto.getImageUrls().isEmpty()) {
            List<BoardImage> boardImages = requestDto.getImageUrls().stream()
                    .map(url -> BoardImage.builder()
                            .board(board)
                            .imageUrl(url)
                            .sortOrder(requestDto.getImageUrls().indexOf(url))
                            .build())
                    .collect(Collectors.toList());
            board.getImages().addAll(boardImages);
            board.setImageUrl(requestDto.getImageUrls().get(0));
        }
        
        boardRepository.save(board);
    }

    @Override
    @Transactional
    public void deletePost(UUID id, String email) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!board.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }
        
        boardRepository.delete(board);
    }

    @Override
    @Transactional
    public BoardResponseDto updatePost(UUID id, BoardUpdateRequestDto request, String email) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!board.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("자신이 작성한 글만 수정할 수 있습니다.");
        }

        board.setTitle(request.getTitle());
        board.setContent(request.getContent());
        board.setRegionName(request.getRegionName());
        board.setCategoryName(request.getCategoryName());
        board.setIsAnonymous(request.getIsAnonymous());

        if (request.getIndustryCategoryId() != null) {
            com.team.nexus.global.entity.IndustryCategory industryCategory = industryCategoryRepository.findById(request.getIndustryCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("해당 업종 카테고리가 존재하지 않습니다."));
            board.setIndustryCategory(industryCategory);
        }

        board.getImages().clear();
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<BoardImage> boardImages = request.getImageUrls().stream()
                    .map(url -> BoardImage.builder()
                            .board(board)
                            .imageUrl(url)
                            .sortOrder(request.getImageUrls().indexOf(url))
                            .build())
                    .collect(Collectors.toList());
            board.getImages().addAll(boardImages);
            board.setImageUrl(request.getImageUrls().get(0));
        } else {
            board.setImageUrl(null);
        }

        Board updatedBoard = boardRepository.save(board);
        return convertToDto(updatedBoard);
    }

    @Override
    @Transactional
    public boolean toggleLike(UUID boardId, String email) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        java.util.Optional<com.team.nexus.global.entity.BoardLike> likeOptional = boardLikeRepository.findByBoardIdAndUserId(boardId, user.getId());
        
        if (likeOptional.isPresent()) {
            boardLikeRepository.delete(likeOptional.get());
            board.setLikeCount(Math.max(0, (board.getLikeCount() == null ? 0 : board.getLikeCount()) - 1));
            return false;
        } else {
            com.team.nexus.global.entity.BoardLike like = com.team.nexus.global.entity.BoardLike.builder()
                    .board(board)
                    .user(user)
                    .build();
            boardLikeRepository.save(like);
            board.setLikeCount((board.getLikeCount() == null ? 0 : board.getLikeCount()) + 1);
            return true;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLiked(UUID boardId, String email) {
        if (email == null) return false;
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;
        
        return boardLikeRepository.existsByBoardIdAndUserId(boardId, user.getId());
    }

    private BoardResponseDto convertToDto(Board board) {
        return BoardResponseDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .imageUrls(board.getImages().stream().map(BoardImage::getImageUrl).collect(Collectors.toList()))
                .author(board.getIsAnonymous() ? "익명" : (board.getUser() != null ? board.getUser().getNickname() : "알 수 없음"))
                .authorId(board.getUser() != null ? board.getUser().getId() : null)
                .regionName(board.getRegionName())
                .categoryName(board.getCategoryName())
                .industryCategoryId(board.getIndustryCategory() != null ? board.getIndustryCategory().getId().toString() : null)
                .industryCategoryName(board.getIndustryCategory() != null ? board.getIndustryCategory().getName() : null)
                .createdAt(board.getCreatedAt())
                .viewCount(board.getViewCount() == null ? 0 : board.getViewCount())
                .likeCount(board.getLikeCount() == null ? 0 : board.getLikeCount())
                .commentCount(commentRepository.countByBoardId(board.getId()))
                .build();
    }
}
