# Synap

메모가 의미로 연결되는 노트앱입니다. 노트를 적으면 임베딩으로 가까운 노트끼리 자동으로 잇고, 그래프로 탐색합니다.

- 프로젝트 소개: https://imjaewoo.dev/work/synap
- 자동연결 그래프 데모: https://imjaewoo.dev/playground/synap

> 이 저장소는 비공개 작업 저장소(백엔드 · 웹)의 공개용 스냅샷입니다.
> 비밀값, 실제 설정 파일, 배포·운영 관련 설정과 문서는 제거했습니다.

## 구조

```
synap/
├── backend/   Spring Boot REST API · Flyway 마이그레이션 · 데모 시드
│   └── src/main/java/com/synap/
│       ├── note/          노트 CRUD · 임베딩 후 자동 링크 · 수동 링크 · 내보내기
│       ├── embedding/     EmbeddingClient 추상화 (OpenAI / 키 없이 쓰는 더미)
│       ├── graph/         개인 그래프 · 스페이스/커뮤니티 그래프
│       ├── search/        의미 기반 검색 (mine / spaces / public)
│       ├── auth/          JWT · Google / Kakao OAuth
│       ├── space/         스페이스(그룹) · 초대
│       ├── comment/ notification/ community/ seed/
│       └── config/
└── web/       React + TypeScript SPA
    └── src/
        ├── api/       fetch 래퍼 · 엔드포인트
        ├── store/     Zustand 스토어
        ├── lib/       clusters(Louvain + TF-IDF) · forceLayout · edgePath · markdown · shareCard
        ├── components/
        └── features/  graph/ notes/ search/ community/ profile/ settings/ auth/ notifications/
```

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 백엔드 | Spring Boot 3.3 · Java 17 · Gradle · Spring Security |
| DB | PostgreSQL 16 + pgvector (HNSW 인덱스, 코사인 거리 `<=>`) |
| 마이그레이션 | Flyway (`V1`–`V12`), JPA `ddl-auto=validate` |
| 임베딩 | OpenAI `text-embedding-3-small` (1536차원), 키가 없을 때는 결정적 더미 임베딩 |
| 인증 | JWT (jjwt) · BCrypt · Google ID 토큰 / Kakao 액세스 토큰 검증 |
| 웹 | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| 그래프 | Canvas 2D 렌더 · d3-force 레이아웃 · d3-zoom |
| 상태 | Zustand |

## 주요 기능

- **자동 연결** — 노트를 저장하면 `제목 + 본문`을 임베딩하고, pgvector kNN(top-8)으로 같은 사용자의 가까운 노트를 찾아 임계값 이상인 것만 양방향 링크로 저장합니다. 저장할 때마다 다시 계산합니다.
- **생각 그래프** — 링크를 엣지로 삼아 Canvas에 그립니다. Louvain으로 군집을 나누고 TF-IDF 키워드로 군집 라벨을 붙입니다.
- **의미 기반 검색** — 키워드가 아니라 벡터 유사도로 검색하며, `내 노트 / 스페이스 / 공개` 범위를 고를 수 있습니다.
- **수동 연결 · 백링크 · 비슷한 노트** — 자동 연결 외에 노트끼리 직접 이을 수 있고, 에디터에서 관련 노트를 함께 보여 줍니다.
- **공개 범위와 커뮤니티** — 노트마다 `private · space · public` 범위를 정합니다. 공개 노트로 이루어진 커뮤니티 그래프에서 비슷하게 생각하는 사람을 발견할 수 있고, 남의 공개 노트를 내 노트로 담을 수 있습니다.
- **스페이스 · 댓글 · 알림** — 그룹 단위 공유와 초대, 노트 댓글, 초대 알림을 지원합니다.
- **소셜 로그인** — Google · Kakao 로그인 후 자체 JWT를 발급합니다.

## 설계에서 고민한 점

### 벡터 전용 DB 대신 pgvector

관계형 데이터(사용자, 스페이스, 공개 범위)와 벡터를 Postgres 하나에 둡니다. 1인 운영에는 이쪽이 단순했습니다.
`embedding vector(1536)` 컬럼은 JPA가 다루지 않고 native SQL(`CAST(:vec AS vector)`, `<=>`)로 읽고 씁니다.
pgvector 확장과 HNSW 인덱스 때문에 스키마는 Flyway가 소유하고, JPA는 `validate`만 합니다.

### 임베딩 제공자 추상화

`EmbeddingClient` 인터페이스 뒤에 OpenAI 구현과 더미 구현을 두고 `app.embedding.provider`로 고릅니다.
더미 구현은 단어와 문자 3-gram을 해시 버킷에 누적해 L2 정규화하는 결정적 벡터라서, API 키 없이도 자동 연결과 그래프를 끝까지 돌려 볼 수 있습니다.
두 구현의 차원(1536)이 같아 스키마 변경 없이 바꿀 수 있지만, 서로 다른 제공자의 벡터는 섞이면 안 되므로 제공자를 바꿀 때는 DB를 비우고 다시 적재해야 합니다.

### 개인 링크는 저장하고, 공유 그래프는 그때 계산

개인 그래프의 링크는 저장 시점에 계산해 `note_link`에 넣어 두고, 노트가 바뀌면 그 노트가 끼어 있는 링크를 지운 뒤 다시 만듭니다.
반면 스페이스·커뮤니티 그래프는 보는 사람과 공개 범위에 따라 노드 집합이 달라지므로, 요청할 때 대상 노트들 사이의 유사도를 임계값으로 걸러 엣지를 만듭니다.

### 군집은 수동 분류 없이, 렌더는 Canvas

카테고리를 미리 정하는 대신 연결 구조에서 의미 덩어리가 떠오르도록 Louvain으로 군집화합니다.
SVG는 노드가 수십 개만 넘어도 버벅여서 한 장에 그리는 Canvas 2D로 렌더합니다.

## 로컬 실행

### 백엔드

```bash
cd backend

# 1) 예시 설정 복사 (application.properties 는 커밋하지 않습니다)
cp src/main/resources/application.example.properties src/main/resources/application.properties

# 2) pgvector DB 띄우기
docker compose up -d db

# 3) 실행 (:8080) — 기본값은 provider=dummy, seed=true
./gradlew bootRun
```

사용자가 한 명도 없는 빈 DB라면 데모 사용자·스페이스·노트가 적재되고 자동 링크가 생성됩니다.
OpenAI 임베딩을 쓰려면 환경 변수를 지정합니다. 더미와 OpenAI 임베딩은 유사도 분포가 달라서 임계값도 함께 조정해야 합니다.

```bash
EMBEDDING_PROVIDER=openai OPENAI_API_KEY=<your-key> LINKING_THRESHOLD=<threshold> ./gradlew bootRun
```

| 환경 변수 | 설명 |
|---|---|
| `DB_URL` · `DB_USER` · `DB_PASSWORD` | PostgreSQL 접속 정보 |
| `EMBEDDING_PROVIDER` | `dummy` 또는 `openai` |
| `OPENAI_API_KEY` | `openai` 제공자일 때 필요합니다 |
| `LINKING_THRESHOLD` | 자동 연결 유사도 임계값 |
| `JWT_SECRET` | JWT 서명키 (32바이트 이상 무작위 문자열) |
| `GOOGLE_CLIENT_ID` | 구글 로그인 (비우면 비활성) |
| `SEED_ENABLED` | 데모 시드 적재 여부 |

테스트는 DB 없이 돌아가는 더미 임베딩 단위 테스트입니다.

```bash
./gradlew test
```

### 웹

```bash
cd web
npm install
npm run dev     # http://localhost:5173, /api 는 localhost:8080 으로 프록시
```

| 환경 변수 | 설명 |
|---|---|
| `VITE_PROXY_TARGET` | dev 프록시 대상 (기본 `http://localhost:8080`) |
| `VITE_API_BASE` | 백엔드 베이스 URL (같은 출처면 비워 둡니다) |
| `VITE_GOOGLE_CLIENT_ID` · `VITE_KAKAO_JS_KEY` | 소셜 로그인 버튼 (없으면 숨김) |
