package com.team.nexus.domain.comment.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreateRequestDto {
    private String content;
    private String parentId;
}
