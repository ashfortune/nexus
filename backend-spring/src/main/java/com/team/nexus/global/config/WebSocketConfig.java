package com.team.nexus.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지 브로커가 해당 접두사가 붙은 목적지(destination)로 메시지를 전달합니다.
        // /topic: 1:N 방송용
        // /queue: 1:1 전송용
        config.enableSimpleBroker("/topic", "/queue");
        
        // 클라이언트에서 메시지를 보낼 때 붙이는 접두사입니다.
        // 예: /app/chat/send
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 엔드포인트를 설정합니다.
        // 클라이언트는 ws://localhost:8080/ws-nexus 로 연결합니다.
        registry.addEndpoint("/ws-nexus")
                .setAllowedOriginPatterns("*"); // SockJS 지원 제거
    }
}
