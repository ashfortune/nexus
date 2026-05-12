import os, uuid, json, time
import redis as redis_lib
import pandas as pd
import anthropic
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
AUTOCOMPLETE_KEY = "equipment:autocomplete"

BASE_DIR        = Path(__file__).parent
EXCEL_EQUIPMENT = BASE_DIR / "음식_설비.xlsx"
EXCEL_TYPES     = BASE_DIR / "음식업종_분류.xlsx"
CSV_SURVIVAL    = BASE_DIR / "영세_자영업_신생기업생존율_20260511154402.csv"

DB_URL = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
API_KEY = os.environ["ANTHROPIC_API_KEY"]

KOSIS_CATEGORIES = [
    "한식 일반 음식점업", "한식 면 요리 전문점", "한식 육류 요리 전문점",
    "한식 해산물 요리 전문점", "중식 음식점업", "일식 음식점업",
    "서양식 음식점업", "기타 외국식 음식점업", "제과점업",
    "피자 햄버거 샌드위치 및 유사 음식점업", "치킨 전문점",
    "김밥 및 기타 간이 음식점업", "간이 음식 포장 판매 전문점",
    "생맥주 전문점", "기타 주점업", "커피 전문점", "기타 비알코올 음료점업",
]

# 단란주점은 서비스 제공 안함 -> 위락 분류 제거
BUILDING_USE = {
    "1종근린": ["제과점", "카페", "떡집", "디저트 전문점", "베이커리 카페", "브런치 카페",
             "토스트가게", "포장마차", "죽집"],
    "2종근린": ["고기구이 전문점", "샤브샤브집", "한정식집", "중국집", "일식집",
             "동남아시아 식당", "인도 식당", "횟집", "뷔페", "분식집", "패스트푸드",
             "치킨 전문점", "피자 전문점", "햄버거 전문점", "국밥집 (대형솥, 장시간 육수류)",
             "국수집", "만두 찐빵집", "국물요리 전문점", "찜닭 전문점", "양꼬치 전문점",
             "마라탕가게", "포케 전문점", "파스타 전문점", "도시락 전문점",
             "족발, 보쌈 전문점", "곱창, 막창 전문점", "닭발 전문점", "무한리필 고기집",
             "꼬치 전문점 ", "이자카야", "회전초밥 집", "스테이크 전문점",
             "샐러드 전문점", "라멘 전문점", "오마카세", "김밥 전문점", "샌드위치 전문점","호프집", "고기주점", "와인바", "칵테일바"]
}

def load_equipment():
    df = pd.read_excel(EXCEL_EQUIPMENT)
    rows = []
    for category in df.columns:
        for name in df[category].dropna():
            name = str(name).strip()
            if name:
                rows.append({"id": str(uuid.uuid4()), "name": name, "category": category})
    return rows

def load_restaurant_types():
    df = pd.read_excel(EXCEL_TYPES, header=None)
    rows = []
    for name in df[0].dropna():
        name = str(name).strip()
        if name:
            building_use = next(
                (code for code, names in BUILDING_USE.items() if name in names), "2종근린"
            )
            rows.append({
                "id": str(uuid.uuid4()),
                "name": name,
                "building_use_code": building_use,
            })
    return rows

def load_survival_rates():
    df = pd.read_csv(CSV_SURVIVAL, encoding="CP949")
    df = df.iloc[1:].reset_index(drop=True)
    df.columns = ["업종","1y_19","2y_19","3y_19","4y_19","5y_19",
                  "1y_20","2y_20","3y_20","4y_20","5y_20",
                  "1y_21","2y_21","3y_21","4y_21","5y_21"]
    num_cols = df.columns[1:]
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce")
    df["avg_1y"] = ((df["1y_19"]+df["1y_20"]+df["1y_21"])/3).round(2)
    df["avg_3y"] = ((df["3y_19"]+df["3y_20"]+df["3y_21"])/3).round(2)
    df["avg_5y"] = ((df["5y_19"]+df["5y_20"]+df["5y_21"])/3).round(2)
    return df[["업종","avg_1y","avg_3y","avg_5y"]].set_index("업종").to_dict("index")

def llm_map_kosis(client, restaurant_name):
    res = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=50,
        messages=[{"role": "user", "content":
            f"음식점 업종 '{restaurant_name}'은 아래 KOSIS 통계 카테고리 중 어디에 해당해?\n"
            f"가장 유사한 카테고리 하나만 골라서 정확히 그 이름만 응답해. 다른 말 하지 마.\n\n"
            f"{json.dumps(KOSIS_CATEGORIES, ensure_ascii=False)}"
                   }]
    )
    return res.content[0].text.strip()

def llm_map_equipment(client, restaurant_name, equipment_list):
    res = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content":
            f"음식점 업종: {restaurant_name}\n\n"
            f"아래 설비 목록에서 이 업종 창업에 필요한 설비를 선택해줘.\n"
            f"- required: 없으면 영업 불가능한 필수 설비\n"
            f"- optional: 있으면 좋지만 없어도 되는 설비\n"
            f"- weight: 해당 설비가 업종 특성을 얼마나 대표하는지 (0.1 ~ 1.0)\n\n"
            f"설비 목록:\n{json.dumps(equipment_list, ensure_ascii=False)}\n\n"
            f"반드시 아래 JSON 형식으로만 응답해. 다른 말 하지 마.\n"
            f'[{{"name": "설비명", "is_required": true, "weight": 0.9}}]'
                   }]
    )
    raw = res.content[0].text.strip().replace("```json","").replace("```","").strip()
    print(f"    RAW: {raw[:200]}")
    return json.loads(raw)

def insert_equipment(engine, rows):
    with engine.begin() as conn:
        for r in rows:
            conn.execute(text(
                "INSERT INTO equipment (id, name, category) VALUES (:id, :name, :category) ON CONFLICT (name) DO NOTHING"
            ), r)
    print(f"[equipment] {len(rows)}개 완료")

def insert_restaurant_types(engine, rows):
    with engine.begin() as conn:
        for r in rows:
            conn.execute(text(
                "INSERT INTO restaurant_types (id, name, building_use_code) VALUES (:id, :name, :building_use_code) ON CONFLICT (name) DO NOTHING"
            ), r)
    print(f"[restaurant_types] {len(rows)}개 완료")

def update_kosis_and_survival(engine, rt_rows, survival_rates, client):
    with engine.begin() as conn:
        for r in rt_rows:
            kosis_cat = llm_map_kosis(client, r["name"])
            sv = survival_rates.get(kosis_cat, {})
            conn.execute(text("""
                              UPDATE restaurant_types
                              SET kosis_category=:kosis, survival_rate_1y=:s1, survival_rate_3y=:s3, survival_rate_5y=:s5
                              WHERE id=:id
                              """), {"id": r["id"], "kosis": kosis_cat,
                                     "s1": sv.get("avg_1y"), "s3": sv.get("avg_3y"), "s5": sv.get("avg_5y")})
            print(f"  {r['name']} → {kosis_cat}")
            time.sleep(0.3)
    print("[KOSIS 매핑 + 생존율 완료]")

def insert_equipment_map(engine, rt_rows, eq_rows, client):
    eq_names  = [e["name"] for e in eq_rows]
    eq_by_name = {e["name"]: e["id"] for e in eq_rows}

    with engine.begin() as conn:
        for r in rt_rows:
            print(f"  매핑 중: {r['name']}")
            try:
                items = llm_map_equipment(client, r["name"], eq_names)
            except Exception as e:
                print(f"  [ERROR] {r['name']}: {e}")
                import traceback; traceback.print_exc()
                continue

            for item in items:
                eq_id = eq_by_name.get(item["name"])
                if not eq_id:
                    continue
                conn.execute(text("""
                                  INSERT INTO restaurant_equipment_map (restaurant_type_id, equipment_id, is_required, weight)
                                  VALUES (:rt_id, :eq_id, :req, :w)
                                  ON CONFLICT DO NOTHING
                                  """), {"rt_id": r["id"], "eq_id": eq_id,
                                         "req": item.get("is_required", True), "w": item.get("weight", 1.0)})
            time.sleep(0.5)
    print("[restaurant_equipment_map 완료]")

def cache_equipment_to_redis(eq_rows):
    r = redis_lib.from_url(REDIS_URL, decode_responses=True)
    pipe = r.pipeline()

    pipe.delete("equipment:autocomplete")
    for eq in eq_rows:
        name = eq["name"]
        pipe.zadd("equipment:autocomplete", {name: 0})
        pipe.hset(f"equipment:detail:{name}", mapping={
            "id":       eq["id"],
            "category": eq["category"],
        })

    pipe.execute()
    r.close()
    print(f"[Redis] equipment:autocomplete {len(eq_rows)}개 캐싱 완료")

def main():
    print("=== seed_data.py 시작 ===")
    client = anthropic.Anthropic(api_key=API_KEY)
    engine = create_engine(DB_URL)

    eq_rows = load_equipment()
    insert_equipment(engine, eq_rows)
    cache_equipment_to_redis(eq_rows)

    rt_rows = load_restaurant_types()
    insert_restaurant_types(engine, rt_rows)

    survival_rates = load_survival_rates()
    update_kosis_and_survival(engine, rt_rows, survival_rates, client)

    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name FROM equipment"))
        eq_rows = [{"id": str(r.id), "name": r.name} for r in result.fetchall()]

    insert_equipment_map(engine, rt_rows, eq_rows, client)

    print("=== 완료 ===")

if __name__ == "__main__":
    main()