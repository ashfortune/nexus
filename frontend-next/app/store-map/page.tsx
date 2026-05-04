import StoreMapClient from "./StoreMapClient";

export const dynamic = 'force-dynamic';

export default async function StoreMapPage() {
  const kakaoApiKey = process.env.JAVA_SCRIPT_KEY || "";
  
  let initialIndustries = [];
  let initialRegions = [];

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/v1/sim/store-list", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      initialIndustries = data.indust_cats || [];
      initialRegions = data.reg_codes || [];
    } else {
      console.error("Backend store-list API returned status:", res.status);
    }
  } catch (e) {
    console.error("Failed to fetch store-list in page.tsx:", e);
  }

  return (
    <StoreMapClient 
      kakaoApiKey={kakaoApiKey} 
      initialIndustries={initialIndustries}
      initialRegions={initialRegions}
    />
  );
}
