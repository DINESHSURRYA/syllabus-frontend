import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get('course_code') || '';

  if (!courseCode.trim()) {
    return NextResponse.json({ exists: false, message: 'No course code provided' });
  }

  const cleanCode = courseCode.trim().toUpperCase();

  try {
    // Check against backend API if available
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/syllabus?search=${encodeURIComponent(cleanCode)}`, {
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
