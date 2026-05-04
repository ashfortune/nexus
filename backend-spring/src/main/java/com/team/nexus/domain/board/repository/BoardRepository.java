package com.team.nexus.domain.board.repository;

import com.team.nexus.global.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {
    Page<Board> findAllByOrderByCreatedAtDesc(Pageable pageable);
    java.util.List<Board> findTop3ByOrderByViewCountDesc();
    Page<Board> findAllByLikeCountGreaterThanEqual(int likeCount, Pageable pageable);
    Page<Board> findByRegionNameAndLikeCountGreaterThanEqual(String regionName, int likeCount, Pageable pageable);
    java.util.List<Board> findTop3ByRegionNameOrderByViewCountDesc(String regionName);
    // --- 자유게시판 전용 (categoryName = 'FREE') ---
    @Query("SELECT b FROM Board b WHERE b.categoryName = 'FREE'")
    Page<Board> findFreeBoards(Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'FREE' AND (" +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "(b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Board> findFreeBoardByKeywordAll(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'FREE' AND LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<Board> findFreeBoardByTitle(@Param("title") String title, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'FREE' AND b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :nickname, '%'))")
    Page<Board> findFreeBoardByPublicUserNickname(@Param("nickname") String nickname, Pageable pageable);

    // --- 지역별 게시판 전용 (categoryName = 'REGION') ---
    @Query("SELECT b FROM Board b WHERE b.categoryName = 'REGION' AND b.regionName = :regionName")
    Page<Board> findByRegionNameOrderByCreatedAtDesc(@Param("regionName") String regionName, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'REGION' AND b.regionName = :regionName AND (" +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "(b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Board> findByRegionNameAndKeywordAll(@Param("regionName") String regionName, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'REGION' AND b.regionName = :regionName AND LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<Board> findByRegionNameAndTitleContainingOrderByCreatedAtDesc(@Param("regionName") String regionName, @Param("title") String title, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'REGION' AND b.regionName = :regionName AND " +
            "b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :nickname, '%'))")
    Page<Board> findByRegionNameAndPublicUserNickname(@Param("regionName") String regionName, @Param("nickname") String nickname, Pageable pageable);

    Page<Board> findByIsAnonymousTrueOrderByCreatedAtDesc(Pageable pageable);

    // --- 업종별 게시판 전용 (categoryName = 'INDUSTRY') ---
    @Query("SELECT b FROM Board b WHERE b.categoryName = 'INDUSTRY' AND b.industryCategory.id = :categoryId")
    Page<Board> findByIndustryCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

    @Query("SELECT b FROM Board b WHERE b.categoryName = 'INDUSTRY' AND b.industryCategory.id = :categoryId AND (" +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "(b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Board> findByIndustryCategoryIdAndKeywordAll(@Param("categoryId") UUID categoryId, @Param("keyword") String keyword, Pageable pageable);
}
