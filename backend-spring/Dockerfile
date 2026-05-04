# 1단계: 빌드 스테이지
FROM gradle:8.10.2-jdk17 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN ./gradlew build --no-daemon -x test

# 2단계: 실행 스테이지
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /home/gradle/src/build/libs/*.jar app.jar

# Koyeb 및 일반적인 컨테이너 환경용 포트 설정
EXPOSE 8080

# 운영 환경 프로파일 활성화
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
