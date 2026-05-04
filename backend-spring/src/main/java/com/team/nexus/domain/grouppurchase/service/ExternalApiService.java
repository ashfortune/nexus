package com.team.nexus.domain.grouppurchase.service;

import java.util.Map;

public interface ExternalApiService {
    /**
     * 외부 API에 POST 요청을 보냅니다.
     */
    <T> T post(String url, Object body, Map<String, String> headers, Class<T> responseType);

    /**
     * 외부 API에 GET 요청을 보냅니다.
     */
    <T> T get(String url, Map<String, String> headers, Class<T> responseType);
}
