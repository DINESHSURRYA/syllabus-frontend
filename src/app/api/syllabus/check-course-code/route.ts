import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/api/config';
import { API } from '@/lib/api/endpoints';
import { buildUrl } from '@/lib/api/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get('course_code') || '';

  if (!courseCode.trim()) {
    return NextResponse.json({ exists: false, message: 'No course code provided' });
  }

  const cleanCode = courseCode.trim().toUpperCase();

  try {
    const url = buildUrl(API.syllabus.list, { search: cleanCode });
    const res = await fetch(url, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      const items = data.items || [];
      const match = items.find((item: any) =>
        (item.courseCode || item.code || '').trim().toUpperCase() === cleanCode
      );
      if (match) {
        return NextResponse.json({
          exists: true,
          matching_syllabus: match,
          message: 'Course code exists in repository'
        });
      }
    }
  } catch (err) {
    console.warn("Backend API check fallback:", err);
  }

  return NextResponse.json({ exists: false });
}
