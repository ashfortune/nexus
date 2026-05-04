import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  // Construct the query string without the 'path' parameter
  const queryParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "path") {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${path}${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch from backend" }, { status: 500 });
  }
}
