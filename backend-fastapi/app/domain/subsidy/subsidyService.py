import requests
import os
import re
from datetime import date, timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import GeminiClient
from dotenv import load_dotenv

load_dotenv()

SMES_API_URL = "https://www.smes.go.kr/fnct/apiReqst/extPblancInfo"
SMES_TOKEN = os.getenv("SMES_API_TOKEN")

def get_embedding(text_input: str):
    return GeminiClient._local_model.encode(text_input).tolist()


def extract_region_from_name(name: str) -> str | None:
    match = re.match(r'^[\[\(]([^\]\)]+)[\]\)]', name)
    return match.group(1) if match else None

REGION_KEYWORDS = [
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
    "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도",
    "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도",
    "제주특별자치도"
]


def classify_life_cycle(item: dict) -> str:
    keywords_map = {
        "창업": ["창업", "스타트업", "예비창업", "창업자"],
        "성장": ["성장", "도약", "확장", "경쟁력강화", "수출"],
        "폐업재기": ["폐업", "재기", "재창업"],
    }
    code_map = {
        "창업": ["PC60"],
        "성장": ["PC20", "PC30", "PC40", "PC50", "PC70"],
        "폐업재기": [],
    }
    life_cycle_code_map = {
        "창업": ["LC01"],
        "성장": ["LC02"],
        "폐업재기": ["LC03"],
    }
    cmp_scale_map = {
        "창업": ["CC60", "CC70"],
        "성장": ["CC10", "CC50"],
        "폐업재기": [],
    }

    biz_type_cd = item.get("bizTypeCd", "")
    life_cycl_cd = item.get("lifeCyclDvsnCd", "")
    cmp_scale_cd = item.get("cmpScaleCd", "")

    check_fields = [
        item.get("bizType", ""),
        item.get("lifeCyclDvsn", ""),
        item.get("cmpScale", ""),
        item.get("pblancNm", ""),
        item.get("policyCnts", ""),
        item.get("sportTrget", ""),
    ]

    for category in ["창업", "성장", "폐업재기"]:
        if any(cd in biz_type_cd for cd in code_map[category]):
            return category
        if any(cd in life_cycl_cd for cd in life_cycle_code_map[category]):
            return category
        if any(cd in cmp_scale_cd for cd in cmp_scale_map[category]):
            return category
        if any(kw in field for kw in keywords_map[category] for field in check_fields):
            return category

    return "기타"


def parse_subsidy(item: dict) -> tuple:
    pblanc_seq = item.get("pblancSeq")
    source_url = f"https://www.smes.go.kr/pblanc/{pblanc_seq}"

    name = item.get("pblancNm", "")
    region = item.get("areaNm") or extract_region_from_name(name) or None

    min_age_raw = item.get("minRpsntAge")
    max_age_raw = item.get("maxRpsntAge")
    max_amount_raw = item.get("maxSportAmt")
    max_amount = int(max_amount_raw) if max_amount_raw else None

    return {
        "name": name,
        "organization": item.get("sportInsttNm"),
        "region": region,
        "industry": item.get("induty") or None,
        "min_age": int(min_age_raw) if min_age_raw else None,
        "max_age": int(max_age_raw) if max_age_raw else None,
        "max_amount": max_amount,
        "deadline": item.get("pblancEndDt") or None,
        "start_date": item.get("pblancBgnDt") or None,
        "description": item.get("policyCnts") or None,
        "support_content": item.get("sportCnts") or None,
        "target": item.get("sportTrget") or None,
        "how_to_apply": item.get("reqstRcept") or None,
        "contact": item.get("refrnc") or None,
        "apply_url": item.get("reqstLinkInfo") or item.get("pblancDtlUrl"),
        "life_cycle": classify_life_cycle(item),
    }, source_url

async def get_subsidy_by_id(db: AsyncSession, subsidy_id):
    result = await db.execute(
        text("""
             SELECT id, name, organization, region, life_cycle,
                    max_amount, deadline, start_date, description,
                    support_content, target, how_to_apply, contact, apply_url
             FROM subsidies
             WHERE id = :id
             """),
        {"id": str(subsidy_id)}
    )
    return result.fetchone()

async def get_subsidies(
        db: AsyncSession,
        region: str = None,
        query: str = None,
        life_cycle: str = None,
        page: int = 1,
        size: int = 10
):
    conditions = ["is_active = true"]
    params = {}

    if region:
        region_text_expr = """
            COALESCE(region, '') || ' ' ||
            COALESCE(name, '') || ' ' ||
            COALESCE(description, '') || ' ' ||
            COALESCE(support_content, '') || ' ' ||
            COALESCE(target, '')
        """

        other_region_conditions = []
        for idx, keyword in enumerate(REGION_KEYWORDS):
            if keyword == region:
                continue

            key = f"region_kw_{idx}"
            other_region_conditions.append(f"{region_text_expr} NOT ILIKE :{key}")
            params[key] = f"%{keyword}%"

        no_other_region_sql = " AND ".join(other_region_conditions)

        conditions.append(f"""
            (
                {region_text_expr} ILIKE :region
                OR {region_text_expr} ILIKE :nationwide
                OR ({no_other_region_sql})
            )
        """)
        params["region"] = f"%{region}%"
        params["nationwide"] = "%전국%"

    if life_cycle:
        conditions.append("life_cycle = :life_cycle")
        params["life_cycle"] = life_cycle

    where = "WHERE " + " AND ".join(conditions)

    if query:
        query_embedding = get_embedding(query)
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

        order = f"""
            ORDER BY
                CASE
                    WHEN name ILIKE :query_exact THEN 0
                    WHEN support_content ILIKE :query_exact THEN 1
                    WHEN description ILIKE :query_exact THEN 2
                    WHEN target ILIKE :query_exact THEN 3
                    ELSE 4
                END,
                embedding <=> '{embedding_str}'::vector
        """

        params["query_exact"] = f"%{query}%"
    else:
        order = "ORDER BY deadline ASC NULLS LAST"

    count_sql = f"SELECT COUNT(*) FROM subsidies {where}"
    result = await db.execute(text(count_sql), params)
    total = result.scalar()

    offset = (page - 1) * size
    params["limit"] = size
    params["offset"] = offset

    data_sql = f"""
        SELECT id, name, organization, region, life_cycle,
               max_amount, deadline, description, apply_url
        FROM subsidies {where}
        {order}
        LIMIT :limit OFFSET :offset
    """
    result = await db.execute(text(data_sql), params)
    rows = result.fetchall()

    return total, rows


async def fetch_subsidies_from_api():
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
    today = date.today().strftime("%Y%m%d")
    params = {
        "token": SMES_TOKEN,
        "strDt": yesterday, #초기 DB 저장시에는 strDt: "20200101" 돌리고 이후에는 yesterday로 변경
        "endDt": today,
        "html": "no"
    }
    try:
        response = requests.get(SMES_API_URL, params=params, timeout=120)
        print(f"status code: {response.status_code}")
        data = response.json()
        if data.get("resultCd") != "0":
            print(f"API 오류: {data.get('resultMsg')}")
            return []
        return data.get("data", [])
    except Exception as e:
        print(f"API 호출 오류: {e}")
        return []


async def save_subsidy(data: dict, source_url: str, db: AsyncSession):
    try:
        embed_text = f"{data['name']} {data.get('description', '') or ''} {data.get('support_content', '') or ''} {data.get('industry', '') or ''}"
        embedding = get_embedding(embed_text)

        deadline = data.get("deadline")
        if deadline and isinstance(deadline, str) and deadline.strip():
            try:
                deadline = datetime.strptime(deadline.strip(), "%Y-%m-%d").date()
                if deadline < date.today():
                    return "skip"
            except ValueError:
                deadline = None
        else:
            deadline = None

        start_date = data.get("start_date")
        if start_date and isinstance(start_date, str):
            try:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError:
                start_date = None

        embedding_str = "[" + ",".join(map(str, embedding)) + "]"

        await db.execute(
            text(f"""
                INSERT INTO subsidies
                    (name, organization, region, industry, min_age, max_age,
                     max_amount, deadline, start_date, description, support_content,
                     target, how_to_apply, contact, apply_url, source_url, embedding, life_cycle)
                VALUES
                    (:name, :organization, :region, :industry, :min_age, :max_age,
                     :max_amount, CAST(:deadline AS DATE), CAST(:start_date AS DATE), :description, :support_content,
                     :target, :how_to_apply, :contact, :apply_url, :source_url, '{embedding_str}'::vector, :life_cycle)
                ON CONFLICT (source_url) DO UPDATE SET
                    deadline = EXCLUDED.deadline,
                    description = EXCLUDED.description,
                    support_content = EXCLUDED.support_content,
                    target = EXCLUDED.target,
                    how_to_apply = EXCLUDED.how_to_apply,
                    contact = EXCLUDED.contact,
                    life_cycle = EXCLUDED.life_cycle,
                    updated_at = NOW()
            """),
            {
                **data,
                "deadline": deadline,
                "start_date": start_date,
                "source_url": source_url
            }
        )
        await db.commit()
        return True
    except Exception as e:
        await db.rollback()
        raise e


async def delete_expired_subsidies(db: AsyncSession):
    await db.execute(
        text("DELETE FROM subsidies WHERE deadline < CAST(:today AS DATE)"),
        {"today": date.today()}
    )
    await db.commit()
    print("만료된 지원금 삭제 완료")


async def collect_subsidies(db: AsyncSession):
    await delete_expired_subsidies(db)

    print("중소벤처24 API 호출 중...")
    items = await fetch_subsidies_from_api()

    success = 0
    skip = 0
    fail = 0
    for item in items:
        try:
            data, source_url = parse_subsidy(item)
            result = await save_subsidy(data, source_url, db)
            if result == "skip":
                skip += 1
            elif result is True:
                success += 1
            else:
                fail += 1
                print(f"알수없는 반환값: {result} / {item.get('pblancNm')}", flush=True)

        except Exception as e:
            fail += 1
            with open("error_log.txt", "a", encoding="utf-8") as f:
                f.write(f"저장 오류 ({item.get('pblancNm')}): {e}\n")

    print(f"총 {success}건 저장, {skip}건 스킵, {fail}건 실패 / 전체 {len(items)}건")