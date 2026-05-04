package com.team.nexus.domain.simulation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.team.nexus.domain.simulation.dto.SemasAPIDto;
import com.team.nexus.domain.simulation.dto.SemasItemDto;
import com.team.nexus.domain.simulation.dto.StoreByRegionDto;
import com.team.nexus.domain.simulation.dto.StoreMapResponseDto;
import com.team.nexus.domain.simulation.repository.AdministrativeBoundaryRepository;
import com.team.nexus.domain.simulation.repository.RegionCodeRepository;
import com.team.nexus.global.entity.AdministrativeBoundaries;
import com.team.nexus.global.entity.RegionCode;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoresServiceImpl implements StoresService {

    private final APIProperties apiProperties;
    private final WebClient dataPortalSemasWebClient;
    private final RegionCodeRepository regionCodeRepository;
    private final AdministrativeBoundaryRepository boundaryRepository;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager em;

    // signguCd → 응답 캐시
    private static final Map<String, StoreMapResponseDto> responseCache = new ConcurrentHashMap<>();
    // countyName → resolved DB prefix 캐시 (old 코드 동일)
    private static final Map<String, String> countyNameToAdmPrefixCache = new ConcurrentHashMap<>();
    // prefix → 근사 WGS84 centroid (startup 시 1회 계산)
    private static final Map<String, double[]> prefixCentroidCache = new ConcurrentHashMap<>();

    /** 앱 완전 시작 후 prefix centroid 캐시 초기화 */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void init() {
        try {
            List<Object[]> samples = boundaryRepository.findPrefixSamples();
            for (Object[] row : samples) {
                String prefix = (String) row[0];
                String boundaryJson = (String) row[1];
                if (boundaryJson == null) continue;

                JsonNode root = objectMapper.readTree(boundaryJson);
                JsonNode point = findFirstPoint(root);
                if (point != null && point.isArray() && point.size() >= 2) {
                    double x = point.get(0).asDouble();
                    double y = point.get(1).asDouble();
                    if (x > 1000) {
                        double DEG = 111319.49;
                        double lat = 38.0 + (y - 600000.0) / DEG;
                        double lng = 127.0 + (x - 200000.0) / (DEG * Math.cos(lat * Math.PI / 180.0));
                        prefixCentroidCache.put(prefix, new double[]{lat, lng});
                    }
                }
            }
            log.info("Loaded {} prefix centroids from DB", prefixCentroidCache.size());
        } catch (Exception e) {
            log.error("Failed to load prefix centroids", e);
        }
    }

    /**
     * old 코드의 resolveAdmPrefix와 동일:
     * region_codes의 WGS84 위경도 → prefixCentroidCache에서 가장 가까운 prefix 반환
     */
    private String resolveAdmPrefix(String signguCd, RegionCode regionCode) {
        if (regionCode == null) return signguCd;
        String countyName = regionCode.getCountyName();
        if (countyName != null && countyNameToAdmPrefixCache.containsKey(countyName)) {
            return countyNameToAdmPrefixCache.get(countyName);
        }

        double dbLat = regionCode.getLatitude()  != null ? regionCode.getLatitude()  : 0.0;
        double dbLng = regionCode.getLongitude() != null ? regionCode.getLongitude() : 0.0;
        if (dbLat == 0.0 && dbLng == 0.0) return signguCd;

        String bestPrefix = null;
        double minDist = Double.MAX_VALUE;
        for (Map.Entry<String, double[]> e : prefixCentroidCache.entrySet()) {
            double[] c = e.getValue();
            double dist = Math.pow(c[0] - dbLat, 2) + Math.pow(c[1] - dbLng, 2);
            if (dist < minDist) {
                minDist = dist;
                bestPrefix = e.getKey();
            }
        }

        if (bestPrefix != null) {
            if (countyName != null) countyNameToAdmPrefixCache.put(countyName, bestPrefix);
            return bestPrefix;
        }
        return signguCd;
    }

    @Override
    @Transactional(readOnly = true)
    public StoreMapResponseDto getStoreList(String signguCd, String semasKsicCode) {
        String cacheKey = signguCd + ":" + semasKsicCode;
        if (responseCache.containsKey(cacheKey)) return responseCache.get(cacheKey);

        try {
            RegionCode sigungu = regionCodeRepository.findByRegionCode(Integer.parseInt(signguCd)).orElse(null);
            double sigLat = (sigungu != null && sigungu.getLatitude()  != null) ? sigungu.getLatitude()  : 37.5665;
            double sigLng = (sigungu != null && sigungu.getLongitude() != null) ? sigungu.getLongitude() : 126.978;

            SemasAPIDto response = dataPortalSemasWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("")
                            .queryParam("serviceKey", apiProperties.getDataPortal().getKey())
                            .queryParam("pageNo", 1)
                            .queryParam("numOfRows", 1000)
                            .queryParam("divId", "signguCd")
                            .queryParam("key", signguCd)
                            .queryParam("indsSclsCd", semasKsicCode)
                            .queryParam("type", "json")
                            .build())
                    .retrieve()
                    .bodyToMono(SemasAPIDto.class)
                    .block();

            if (response == null || response.getBody() == null || response.getBody().getItems() == null) {
                return StoreMapResponseDto.builder()
                        .totalCount(0).storeByRegionDtoList(Collections.emptyList())
                        .centerLat(sigLat).centerLng(sigLng).build();
            }

            List<SemasItemDto> items = response.getBody().getItems();

            // old 코드 동일: adongNm 기반 카운트맵
            Map<String, Integer> adongNmCountMap = items.stream()
                    .filter(item -> item.getAdongNm() != null)
                    .collect(Collectors.groupingBy(
                            item -> item.getAdongNm() != null ? item.getAdongNm() : "",
                            Collectors.summingInt(item -> 1)));
            log.info("adongNmCountMap sample: {}", adongNmCountMap.entrySet().stream()
                    .limit(5).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

            Set<String> adongNmSet = adongNmCountMap.keySet();

            // 1. 이름 기반 후보 prefix 추출 (투표 방식)
            List<Object[]> prefixCounts = boundaryRepository.findPrefixCountsForNames(adongNmSet);

            // 2. 후보 중 좌표가 가장 가까운 것 선택 (전국 동명이동 중복 방지)
            String admPrefix;
            if (prefixCounts.isEmpty()) {
                admPrefix = resolveAdmPrefix(signguCd, sigungu);
            } else {
                final double targetLat = sigLat;
                final double targetLng = sigLng;
                admPrefix = prefixCounts.stream()
                        .map(row -> (String) row[0])
                        .min(Comparator.comparingDouble(p -> {
                            double[] c = prefixCentroidCache.getOrDefault(p, new double[]{0, 0});
                            if (c[0] == 0) return Double.MAX_VALUE;
                            return Math.pow(c[0] - targetLat, 2) + Math.pow(c[1] - targetLng, 2);
                        }))
                        .orElse(signguCd);
            }
            log.info("Resolved admPrefix for {}: {}", signguCd, admPrefix);

            // 해당 시군구의 모든 행정동 경계 조회 (데이터가 0개인 비어있는 동네도 포함)
            List<AdministrativeBoundaries> boundaries =
                    boundaryRepository.findByAdmCdStartingWith(admPrefix);
            log.info("boundaries size for prefix={}: {}", admPrefix, boundaries.size());

            List<StoreByRegionDto> regions = boundaries.stream()
                    .map(b -> {
                        // old 코드 동일: 정확 매칭 후 실패 시 normalizeAdmNm 퍼지 매칭
                        int count = adongNmCountMap.getOrDefault(b.getAdmNm(), 0);
                        if (count == 0) {
                            final String normNm = normalizeAdmNm(b.getAdmNm());
                            count = adongNmCountMap.entrySet().stream()
                                    .filter(e -> normalizeAdmNm(e.getKey()).equals(normNm))
                                    .mapToInt(Map.Entry::getValue).sum();
                        }
                        // 좌표 중첩 깊이로 Polygon / MultiPolygon 자동 판별
                        JsonNode geometry = null;
                        try {
                            JsonNode coords = objectMapper.readTree(b.getBoundary());
                            boolean isMulti = coords.isArray() && coords.size() > 0
                                    && coords.get(0).isArray() && coords.get(0).size() > 0
                                    && coords.get(0).get(0).isArray() && coords.get(0).get(0).size() > 0
                                    && coords.get(0).get(0).get(0).isArray();
                            ObjectNode geoJson = objectMapper.createObjectNode();
                            geoJson.put("type", isMulti ? "MultiPolygon" : "Polygon");
                            geoJson.set("coordinates", coords);
                            geometry = geoJson;
                        } catch (Exception e) {
                            log.warn("boundary parse error adm_cd={}: {}", b.getAdmCd(), e.getMessage());
                        }
                        return StoreByRegionDto.builder()
                                .adongCd(b.getAdmCd()).adongNm(b.getAdmNm())
                                .count(count).geometry(geometry).build();
                    })
                    .toList();

            StoreByRegionDto mostRegion   = regions.stream().max(Comparator.comparingInt(StoreByRegionDto::getCount)).orElse(null);
            StoreByRegionDto leastRegion  = regions.stream().min(Comparator.comparingInt(StoreByRegionDto::getCount)).orElse(null);

            StoreMapResponseDto result = StoreMapResponseDto.builder()
                    .totalCount(items.size()).mostRegion(mostRegion).leastRegion(leastRegion)
                    .storeByRegionDtoList(regions).centerLat(sigLat).centerLng(sigLng).build();

            responseCache.put(cacheKey, result);
            log.info("items={}, regions={}, regions with count>0={}",
                    items.size(), regions.size(), regions.stream().filter(r -> r.getCount() > 0).count());
            return result;

        } catch (Exception e) {
            log.error("Error in getStoreList signguCd={}, ksicCode={}", signguCd, semasKsicCode, e);
            throw new RuntimeException("Internal Server Error occurred while processing store list", e);
        }
    }

    private String normalizeAdmNm(String nm) {
        if (nm == null) return "";
        return nm.replaceAll("[·.·,\\s]+", "");
    }

    private JsonNode findFirstPoint(JsonNode node) {
        if (node == null || !node.isArray()) return null;
        if (node.size() > 0 && node.get(0).isNumber()) return node;
        for (JsonNode child : node) {
            JsonNode p = findFirstPoint(child);
            if (p != null) return p;
        }
        return null;
    }
}
