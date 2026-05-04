package com.team.nexus.global.security.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        try (java.io.FileWriter fw = new java.io.FileWriter("C:/nexus/oauth_debug.log", true)) {
            fw.write(new java.util.Date() + " - CustomOAuth2UserService.loadUser started for: " + registrationId + "\n");
        } catch (java.io.IOException e) {
            log.error("Log file write error", e);
        }
        
        String email = "";
        String nickname = "";
        int loginType = 0; // 0: Local, 1: Google, 2: Kakao

        if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");
            loginType = 1;
        } else if ("kakao".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            email = (String) kakaoAccount.get("email");
            nickname = (String) profile.get("nickname");
            loginType = 2;
        }

        saveOrUpdate(email, nickname, loginType);

        try (java.io.FileWriter fw = new java.io.FileWriter("C:/nexus/oauth_debug.log", true)) {
            fw.write(new java.util.Date() + " - CustomOAuth2UserService.loadUser completed for: " + email + "\n");
        } catch (java.io.IOException e) {
            log.error("Log file write error", e);
        }

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttributeName
        );
    }

    private void saveOrUpdate(String email, String nickname, int loginType) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // 닉네임 정도만 업데이트하거나 필요 로직 추가
            user.setNickname(nickname);
            userRepository.save(user);
        } else {
            User user = User.builder()
                    .email(email)
                    .nickname(nickname)
                    .passwd("") // 소셜 로그인은 비밀번호 없음
                    .userType(0) // 기본 일반 회원
                    .loginType(loginType)
                    .address("") // 소셜 로그인은 주소 정보 없음
                    .build();
            userRepository.save(user);
        }
    }
}
