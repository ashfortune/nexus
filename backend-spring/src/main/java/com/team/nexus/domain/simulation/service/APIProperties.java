package com.team.nexus.domain.simulation.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "api")
@Component
@Getter
@Setter
public class APIProperties {
    // 공공데이터포탈 api
    private DataPortal dataPortal = new DataPortal();
    // 카카오지도 api
    private Kakao kakao = new Kakao();

    @Getter
    @Setter
    public static class DataPortal {
        private String key;
        private String realEstateUrl;
        private String semasUrl;
    }

    @Getter
    @Setter
    public static class Kakao {
        private String key;
        private String url;
    }
}

