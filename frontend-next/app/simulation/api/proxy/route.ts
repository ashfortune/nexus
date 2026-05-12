import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  // Construct the query string without the 'path' parameter
  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'path') {
      queryParams[key] = value;
    }
  });

  try {
    const response = await api.get(path, {
      params: queryParams,
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from backend' },
      { status: error.status || 500 }
    );
  }
}
