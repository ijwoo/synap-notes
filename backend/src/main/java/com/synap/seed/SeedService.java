package com.synap.seed;

import com.synap.auth.User;
import com.synap.auth.UserRepository;
import com.synap.config.LinkingProperties;
import com.synap.embedding.EmbeddingClient;
import com.synap.embedding.VectorLiterals;
import com.synap.note.Note;
import com.synap.note.NoteLinkRepository;
import com.synap.note.NoteRepository;
import com.synap.note.SimilarityProjection;
import com.synap.space.Space;
import com.synap.space.SpaceMember;
import com.synap.space.SpaceMemberRepository;
import com.synap.space.SpaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/** 데모 유저 4명 + 노트(OpenAI 임베딩) + 스페이스 2개 + 멤버십 시드. 유저가 없을 때만. */
@Service
public class SeedService {

    private static final Logger log = LoggerFactory.getLogger(SeedService.class);
    private static final String PASSWORD = "synap1234";

    private final UserRepository users;
    private final SpaceRepository spaces;
    private final SpaceMemberRepository members;
    private final NoteRepository notes;
    private final NoteLinkRepository links;
    private final PasswordEncoder encoder;
    private final EmbeddingClient embedding;
    private final LinkingProperties linking;

    public SeedService(UserRepository users, SpaceRepository spaces, SpaceMemberRepository members,
                       NoteRepository notes, NoteLinkRepository links, PasswordEncoder encoder,
                       EmbeddingClient embedding, LinkingProperties linking) {
        this.users = users;
        this.spaces = spaces;
        this.members = members;
        this.notes = notes;
        this.links = links;
        this.encoder = encoder;
        this.embedding = embedding;
        this.linking = linking;
    }

    @Transactional
    public void seed() {
        User me = user("me@synap.dev", "나");
        User jiwoo = user("jiwoo@synap.dev", "지우");
        User hyunwoo = user("hyunwoo@synap.dev", "현우");
        User minjae = user("minjae@synap.dev", "민재");

        Space ml = space("ML 사이드프로젝트", "flask", me);
        member(ml, me, "owner");
        member(ml, jiwoo, "member");
        Space writing = space("글쓰기 모임", "pen", me);
        member(writing, me, "owner");
        member(writing, hyunwoo, "member");

        // (user, title, body, topic, visibility, spaceId)
        List<Long> created = new ArrayList<>();
        record N(User u, String title, String body, String topic, String vis, Long space) {}
        Long mlId = ml.getId();
        Long wId = writing.getId();
        List<N> specs = List.of(
                // ===== 나 (me): 임베딩/RAG · 러닝 · 커피 =====
                new N(me, "임베딩으로 노트 자동 연결", "텍스트를 임베딩 벡터로 바꿔 코사인 유사도로 가까운 노트를 자동 연결하는 아이디어.", "dev", "space", mlId),
                new N(me, "벡터 검색 캐싱 전략", "임베딩 결과를 캐싱해 반복 질의 비용을 줄이기. TTL/무효화와 pgvector kNN 앞단 캐시.", "dev", "private", null),
                new N(me, "pgvector HNSW 인덱스 튜닝", "HNSW 인덱스의 m/ef 파라미터로 임베딩 벡터 검색 속도와 정확도 균형 잡기.", "dev", "space", mlId),
                new N(me, "OpenAI 임베딩 비용 최적화", "text-embedding-3-small로 임베딩 차원과 비용을 줄이고 배치로 호출을 묶기.", "dev", "public", null),
                new N(me, "RAG 파이프라인 설계", "검색 증강 생성: 임베딩으로 관련 문서를 검색해 LLM 프롬프트에 넣어 답을 만든다.", "dev", "public", null),
                new N(me, "AI 세컨드 브레인 단상", "임베딩으로 내 생각을 자동 연결하는 세컨드 브레인. 벡터 검색이 지식의 재발견을 돕는다.", "dev", "public", null),
                new N(me, "아침 러닝 5km 기록", "아침에 5km 가볍게 달리며 페이스와 심박, 컨디션을 적어두는 러닝 일지.", "life", "public", null),
                new N(me, "인터벌 러닝 훈련법", "달리기 속도를 올리기 위한 인터벌 트레이닝과 회복 러닝 루틴.", "life", "public", null),
                new N(me, "주말 등산 코스 메모", "근교 산 등산 코스와 소요 시간, 다음에 달려볼 트레일 러닝 코스 정리.", "life", "private", null),
                new N(me, "홈카페 에스프레소 추출", "원두 분쇄도와 추출 시간을 바꿔가며 에스프레소 맛을 잡는 홈카페 기록.", "life", "public", null),
                new N(me, "핸드드립 원두별 레시피", "원두 산지별로 핸드드립 물온도와 푸어링을 바꿔가며 커피 맛을 기록.", "life", "public", null),
                new N(me, "라떼아트 연습 일지", "우유 스티밍과 푸어링으로 라떼아트 하트와 로제타를 연습한 커피 기록.", "life", "private", null),

                // ===== 지우 (jiwoo): 벡터검색 · 요리 · 여행 =====
                new N(jiwoo, "임베딩 모델 비교", "text-embedding-3-small vs 로컬 모델. 임베딩 차원과 의미 검색 품질 비교.", "dev", "space", mlId),
                new N(jiwoo, "kNN 최근접 이웃 검색", "벡터 공간에서 가장 가까운 이웃을 찾는 kNN과 근사 최근접(ANN) 차이.", "dev", "space", mlId),
                new N(jiwoo, "벡터DB 운영 회고", "벡터 검색 캐싱과 인덱스 재빌드 운영에서 배운 점들. 임베딩 파이프라인 안정화.", "dev", "public", null),
                new N(jiwoo, "시맨틱 검색 vs 키워드 검색", "키워드 일치가 아니라 의미로 찾는 시맨틱 벡터 검색의 장점과 한계.", "dev", "public", null),
                new N(jiwoo, "코사인 유사도 직관", "두 임베딩 벡터의 각도로 의미적 거리를 재는 코사인 유사도 이해하기.", "dev", "public", null),
                new N(jiwoo, "도커 컴포즈로 로컬 개발", "db/api/web를 컨테이너로 한 번에 띄워 로컬 개발 환경을 일관되게 유지.", "dev", "public", null),
                new N(jiwoo, "라멘 육수 끓이기", "닭뼈와 다시마로 진하게 우린 라멘 국물과 차슈 만들기 요리 기록.", "life", "public", null),
                new N(jiwoo, "김치찌개 황금 레시피", "묵은지와 돼지고기로 끓이는 김치찌개 간 맞추기 요리 메모.", "life", "public", null),
                new N(jiwoo, "알리오올리오 파스타", "마늘과 올리브유로 만드는 기본 파스타, 면수로 유화하는 요리 팁.", "life", "public", null),
                new N(jiwoo, "에어프라이어 요리 모음", "에어프라이어로 간단하게 만드는 닭다리와 감자 요리 레시피 모음.", "life", "private", null),
                new N(jiwoo, "교토 여행 메모", "조용한 절과 골목 카페를 돌아본 교토 여행 코스와 맛집 기록.", "life", "public", null),
                new N(jiwoo, "오사카 맛집 투어", "오사카 도톤보리 길거리 음식과 맛집을 돌아본 여행 메모.", "life", "public", null),

                // ===== 현우 (hyunwoo): 글쓰기/제텔카스텐 · 식물 · 명상/수면 =====
                new N(hyunwoo, "글쓰기는 생각의 도구", "흩어진 생각을 글로 정리하면 메모가 연결되고 아이디어가 선명해진다.", "think", "space", wId),
                new N(hyunwoo, "지식 그래프로 글감 모으기", "메모를 의미로 연결해 글감 클러스터를 만들고 목차로 발전시키기.", "think", "space", wId),
                new N(hyunwoo, "제텔카스텐 실천법", "작은 메모를 의미로 엮어 지식 그래프를 키우는 제텔카스텐 글쓰기 방법.", "think", "space", wId),
                new N(hyunwoo, "매일 한 문장 쓰기", "부담 없이 하루 한 문장씩 쓰며 글쓰기 근육을 만드는 습관.", "think", "public", null),
                new N(hyunwoo, "블로그 글감 노트", "떠오른 글쓰기 주제를 모아두고 연결되는 것끼리 묶어 글로 키우기.", "think", "public", null),
                new N(hyunwoo, "아침 메모 루틴", "아침마다 떠오른 생각을 메모하고 글로 정리하는 글쓰기 루틴.", "think", "public", null),
                new N(hyunwoo, "몬스테라 키우기 일지", "몬스테라 물주기 주기와 새 잎 상태를 기록하는 식물 집사 일지.", "life", "public", null),
                new N(hyunwoo, "다육이 물주기 기록", "다육식물 분갈이와 물주기 간격을 기록하는 식물 가꾸기 노트.", "life", "public", null),
                new N(hyunwoo, "명상 10분 호흡 루틴", "아침 10분 호흡 명상으로 마음을 가라앉히고 하루 집중을 준비한다.", "life", "public", null),
                new N(hyunwoo, "수면의 질 높이기", "잠들기 전 루틴과 빛 차단으로 수면의 질을 높이는 방법.", "life", "public", null),
                new N(hyunwoo, "독서 노트: 도둑맞은 집중력", "산만함의 원인을 다룬 책에서 집중을 되찾는 법을 정리한 독서 노트.", "life", "public", null),
                new N(hyunwoo, "책 리뷰: 아주 작은 습관의 힘", "1%씩 나아지는 작은 습관이 복리로 쌓인다는 책의 독서 메모.", "life", "public", null),

                // ===== 민재 (minjae): 커리어/리더십 · 사진 · 재테크 =====
                new N(minjae, "시니어 성장 로드맵", "엔지니어가 코드 너머 팀과 커리어를 함께 키우는 성장 경로.", "career", "public", null),
                new N(minjae, "이직 인터뷰 준비", "이직을 위한 인터뷰 준비와 커리어 방향 점검 체크리스트.", "career", "public", null),
                new N(minjae, "팀 리딩 노트", "리더십과 커뮤니케이션이 커리어 성장에 미치는 영향.", "career", "public", null),
                new N(minjae, "1on1 미팅 잘하기", "정기 1on1로 신뢰를 쌓고 커리어 성장 피드백을 주고받는 법.", "career", "public", null),
                new N(minjae, "개발자 포트폴리오 정리", "프로젝트를 문제-해결-임팩트로 정리해 이직용 포트폴리오로 만들기.", "career", "public", null),
                new N(minjae, "연봉 협상 준비", "시장가 조사와 성과 근거 정리로 임하는 이직 연봉 협상 준비.", "career", "private", null),
                new N(minjae, "사진 구도 삼분할", "삼분할과 프레이밍으로 사진 구도를 잡는 촬영 연습 메모.", "life", "public", null),
                new N(minjae, "빛과 그림자 사진", "역광과 그림자를 활용해 분위기 있는 사진을 찍는 촬영 노트.", "life", "public", null),
                new N(minjae, "인물 사진 보정법", "인물 사진의 피부 톤과 색감을 자연스럽게 보정하는 사진 편집 기록.", "life", "private", null),
                new N(minjae, "주식 장기투자 원칙", "분산과 장기 보유로 시장을 따라가는 주식 투자 원칙 메모.", "life", "public", null),
                new N(minjae, "가계부 정리 습관", "매달 지출을 분류해 기록하고 저축률을 높이는 가계부 습관.", "life", "public", null),
                new N(minjae, "ETF 적립식 투자", "지수 ETF를 매달 적립식으로 모아가는 장기 투자 기록.", "life", "private", null),
                new N(minjae, "딥워크 몰입 실천기", "방해 없는 몰입 시간을 확보해 깊은 작업의 질을 높인 생산성 경험.", "career", "public", null),
                new N(minjae, "포모도로 집중법", "25분 집중 5분 휴식으로 미루는 일을 잘게 쪼개 시작하는 집중법.", "career", "public", null)
        );

        // 1차: 노트 + 임베딩 (literal 보관해 재임베딩 방지)
        record Embedded(long id, long userId, String literal) {}
        List<Embedded> embedded = new ArrayList<>();
        for (N s : specs) {
            Note note = notes.saveAndFlush(new Note(s.u().getId(), s.title(), s.body(), s.topic(), s.vis(), s.space()));
            String literal = VectorLiterals.toLiteral(embedding.embed(s.title() + "\n" + s.body()));
            notes.updateEmbedding(note.getId(), literal);
            embedded.add(new Embedded(note.getId(), s.u().getId(), literal));
            created.add(note.getId());
        }
        // 기존 주인 없는 노트는 me 로 귀속(보존)
        int orphans = notes.assignOrphans(me.getId());

        // 2차: 개인 백링크 재계산(모든 임베딩 적재 후)
        for (Embedded e : embedded) {
            relinkOwner(e.id(), e.userId(), e.literal());
        }

        log.info("Seeded {} demo notes for 4 users (+{} orphan notes -> me), 2 spaces", created.size(), orphans);
    }

    private void relinkOwner(long id, long userId, String literal) {
        links.deleteAllInvolving(id);
        List<SimilarityProjection> neighbors =
                notes.findNearestForUser(literal, userId, id, linking.topK());
        for (SimilarityProjection n : neighbors) {
            double sim = Math.min(1.0, Math.max(0.0, n.getSimilarity()));
            if (sim < linking.threshold()) continue;
            links.upsert(id, n.getId(), (float) sim);
            links.upsert(n.getId(), id, (float) sim);
        }
    }

    private User user(String email, String name) {
        return users.save(new User(email, encoder.encode(PASSWORD), name));
    }

    private Space space(String name, String icon, User owner) {
        return spaces.save(new Space(name, icon, owner.getId()));
    }

    private void member(Space s, User u, String role) {
        members.save(new SpaceMember(s.getId(), u.getId(), role));
    }
}
