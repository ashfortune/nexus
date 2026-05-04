import os
import httpx
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

class KiprisClient:
    def __init__(self):
        self.api_key = os.getenv("KIPRIS_API_KEY")
        # 대표님께서 제공해주신 샘플 엔드포인트 (getWordSearch)
        self.base_url = "http://plus.kipris.or.kr/kipo-api/kipi/trademarkInfoSearchService/getWordSearch"

    async def check_trademark(self, brand_name: str) -> Dict[str, Any]:
        """
        KIPRIS API를 호출하여 상표 중복 여부를 확인합니다.
        """
        if not self.api_key:
            return {"status": "UNKNOWN", "message": "KIPRIS API Key가 설정되지 않았습니다."}

        import urllib.parse
        encoded_name = urllib.parse.quote(brand_name)
        
        # 샘플 형식에 맞춘 파라미터 구성
        url = f"{self.base_url}?searchString={encoded_name}&searchRecentYear=0&ServiceKey={self.api_key}"




        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(url, timeout=10.0)


                response.raise_for_status()
                print(f"DEBUG Success Response: {response.text}")

                
                # XML 파싱

                root = ET.fromstring(response.content)
                
                # 결과 카운트 확인
                total_count_tag = root.find(".//totalCount")
                total_count = int(total_count_tag.text) if total_count_tag is not None else 0

                if total_count == 0:
                    return {
                        "status": "SAFE",
                        "count": 0,
                        "message": "동일한 상표가 발견되지 않았습니다. 등록 가능성이 높습니다."
                    }
                
                # 상세 결과 분석
                items = root.findall(".//item")
                
                # 1. 완전 일치 여부 전수 조사 (상위 5개 중)
                is_danger = False
                match_details = None
                
                for item in items:
                    title = item.findtext("title")
                    status = item.findtext("applicationStatus")
                    
                    if not title: continue
                    
                    # 공백 및 특수문자 제거 후 비교
                    clean_brand = "".join(filter(str.isalnum, brand_name))
                    clean_title = "".join(filter(str.isalnum, title))
                    
                    if clean_brand == clean_title or clean_brand in clean_title:
                        is_danger = True
                        match_details = {"title": title, "status": status}
                        break

                # 2. 결과 개수 기반 판정 (너무 많으면 위험)
                if is_danger or total_count > 50:
                    return {
                        "status": "DANGER",
                        "count": total_count,
                        "message": f"'{brand_name}'과(와) 일치하거나 매우 유사한 상표가 {total_count}건 존재합니다. 사용이 불가합니다.",
                        "details": match_details if match_details else {"total_count": total_count}
                    }
                
                if total_count > 0:
                    first_item = items[0] if items else None
                    return {
                        "status": "WARNING",
                        "count": total_count,
                        "message": f"유사한 상표가 {total_count}건 존재합니다. 신중한 검토가 필요합니다.",
                        "details": {"title": first_item.findtext("title"), "status": first_item.findtext("applicationStatus")} if first_item is not None else {}
                    }

                return {"status": "SAFE", "count": 0, "message": "검색 결과가 없습니다. 안전하게 사용 가능합니다."}


        except Exception as e:
            # 에러 발생 시 응답 원문 확인 (디버깅용)
            try:
                print(f"DEBUG Response Snippet: {response.text[:500]}")
            except:
                pass
            print(f"KIPRIS API Error: {str(e)}")
            return {"status": "ERROR", "message": f"API 호출 중 오류 발생: {str(e)}"}


_kipris_client = None

def get_kipris_client():
    global _kipris_client
    if _kipris_client is None:
        _kipris_client = KiprisClient()
    return _kipris_client
