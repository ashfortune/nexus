package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "passwd", nullable = false)
    private String passwd;

    @Column(name = "user_type")
    private Integer userType; // 0: 일반, 1: 사업가, 2: 관리자

    @Column(name = "biz_no", length = 12)
    private String bizNo;

    @Column(name = "address")
    private String address;

    @Column(name = "login_type")
    private Integer loginType;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
}
