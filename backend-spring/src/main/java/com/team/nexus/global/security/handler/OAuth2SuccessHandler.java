package com.team.nexus.global.security.handler;

import com.team.nexus.global.entity.User;
import com.team.nexus.global.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final com.team.nexus.domain.auth.repository.UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException,
            ServletException {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oAuth2User.getAttributes();

            String email = "";
            if (attributes.containsKey("email")) {
                email = (String) attributes.get("email");
            } else if (attributes.containsKey("kakao_account")) {
                Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
                email = (String) kakaoAccount.get("email");
            }

            // 실제 유저 정보 조회
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ServletException("사용자를 찾을 수 없습니다."));
            String token = jwtTokenProvider.createToken(email, user.getId(), user.getUserType());
            String provider = ((org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication)
                    .getAuthorizedClientRegistrationId();
            log.info("OAuth2 Login Success: {} (ID: {}), Provider: {}", email, user.getId(), provider);

            // 접속한 서버 주소에 따라 프론트엔드 URL 결정
            String host = request.getServerName();
            String baseUrl = (host.equals("localhost") || host.equals("127.0.0.1")) 
                             ? "http://localhost:3000" 
                             : "https://nexus-sigma-gilt.vercel.app";

            // 닉네임 한글 인코딩 및 URL 생성
            String targetUrl = UriComponentsBuilder.fromUriString(baseUrl + "/auth/oauth-callback")
                    .queryParam("token", token)
                    .queryParam("userId", user.getId().toString())
                    .queryParam("nickname", user.getNickname())
                    .queryParam("email", user.getEmail())
                    .queryParam("userType", user.getUserType())
                    .queryParam("provider", provider)
                    .queryParam("profileImage", user.getProfileImage())
                    .build()
                    .encode(java.nio.charset.StandardCharsets.UTF_8)
                    .toUriString();
            
            log.info("Redirecting to (Host: {}): {}", host, targetUrl);
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            log.error("OAuth2 Success Handler Error: ", e);
            String host = request.getServerName();
            String errorBaseUrl = (host.equals("localhost") || host.equals("127.0.0.1")) 
                                  ? "http://localhost:3000" 
                                  : "https://nexus-sigma-gilt.vercel.app";
            response.sendRedirect(errorBaseUrl + "/auth/login?error=auth_failed");
        }
    }
}