package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "administrative_boundaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdministrativeBoundaries {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "adm_cd", nullable = false, length = 20)
    private String admCd;

    @Column(name = "adm_nm", nullable = false, length = 100)
    private String admNm;

    // JSONB 컬럼 — GeoJSON 형식의 경계 데이터를 String으로 저장
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "boundary", nullable = false, columnDefinition = "jsonb")
    private String boundary;
}
