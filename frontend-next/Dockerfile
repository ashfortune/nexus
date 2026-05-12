# 1단계: 의존성 설치
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2단계: 빌드 수행
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js 빌드 수행
RUN npm run build

# 3단계: 실행 스테이지
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# 빌드 결과물 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Next.js 실행
CMD ["npm", "start"]
