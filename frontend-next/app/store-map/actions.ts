"use server";

const API_BASE_URL = "http://localhost:8080/api/v1"

export async function fetchStoresData(regionCode: string, ksicCode: string) {
  console.log(`[Server Action] Fetching stores for Region: ${regionCode}, KSIC: ${ksicCode}`);
  try {
    const res = await fetch(`${API_BASE_URL}/sim/stores?signguCd=${regionCode}&semasKsicCode=${ksicCode}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Backend returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch stores data from backend:", error);
    return null;
  }
}
