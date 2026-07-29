"use client";

import { useState, useEffect, useMemo } from 'react';
import { CurriculumService, CourseDataModel, CurriculumTopic } from '@/lib/services/curriculum-service';
import { useSyllabusStore } from '@/stores/syllabus.store';
import { client, API, curriculumApi, syllabusApi } from '@/lib/api';

export function useCurriculumData(
  searchQuery = '',
  difficultyFilter = 'All',
  unitFilter = 'All',
  selectedSyllabusId = '',
  sortBy = 'Recently Uploaded'
) {
  const [data, setData] = useState<CourseDataModel | null>(null);
  const [savedSyllabi, setSavedSyllabi] = useState<Array<{ id: string; code: string; title: string; updatedAt?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSyllabi = async () => {
      try {
        let resData: any;
        try {
          resData = await client.get(API.syllabus.saved);
        } catch {
          resData = await syllabusApi.getSyllabusList();
        }

        if (resData) {
          const courseList = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.items)
            ? resData.items
            : [];

          if (isMounted) {
            const seenKeys = new Set<string>();
            const formatted: Array<{ id: string; code: string; title: string; updatedAt?: string }> = [];

            courseList.forEach((c: any) => {
              const courseInfo = c && typeof c.course === 'object' && c.course ? c.course : c;
              const code = (c.courseCode || c.code || courseInfo?.code || courseInfo?.courseCode || '').trim();
              const title = (c.courseName || c.title || courseInfo?.title || courseInfo?.courseName || c.courseTitle || '').trim();
              const id = c.id || c.syllabusId || courseInfo?.id || code || 'course_default';

              const dedupKey = (code || id).toLowerCase();
              if (code && title && !seenKeys.has(dedupKey)) {
                seenKeys.add(dedupKey);
                formatted.push({
                  id,
                  code,
                  title,
                  updatedAt: c.updatedAt || c.timestamp || c.createdAt || new Date().toISOString(),
                });
              }
            });

            if (sortBy === 'Recently Uploaded') {
              formatted.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
            } else if (sortBy === 'Course Code (A-Z)') {
              formatted.sort((a, b) => a.code.localeCompare(b.code));
            } else if (sortBy === 'Course Title (A-Z)') {
              formatted.sort((a, b) => a.title.localeCompare(b.title));
            }

            setSavedSyllabi(formatted);
          }
        }
      } catch (err: any) {
        console.warn('Failed to fetch saved syllabi list:', err);
      }
    };

    fetchSyllabi();

    return () => {
      isMounted = false;
    };
  }, [sortBy]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadCurriculum = async () => {
      try {
        let loadedData: CourseDataModel | null = null;

        if (selectedSyllabusId) {
          try {
            const fullSyllabus = await syllabusApi.getSyllabusById(selectedSyllabusId);
            if (fullSyllabus && Array.isArray(fullSyllabus.units) && fullSyllabus.units.length > 0) {
              loadedData = CurriculumService.transformSyllabusToCurriculumModel(fullSyllabus);
            }
          } catch (err) {
            console.warn(`Could not load syllabus with ID ${selectedSyllabusId} from DB, will generate and save...`, err);
          }

          // Auto-generate and save to PostgreSQL DB if not in DB
          if (!loadedData) {
            try {
              const defaultSyllabus = CurriculumService.createDefaultSyllabusForCourse(selectedSyllabusId);
              await syllabusApi.saveVerifiedSyllabus(selectedSyllabusId, defaultSyllabus);
              
              // Retrieve freshly saved record from PostgreSQL DB
              const dbSyllabus = await syllabusApi.getSyllabusById(selectedSyllabusId);
              if (dbSyllabus) {
                loadedData = CurriculumService.transformSyllabusToCurriculumModel(dbSyllabus);
              }
            } catch (autoErr) {
              console.warn('Auto-generate and save to DB failed:', autoErr);
            }
          }
        }

        if (!loadedData) {
          const storeSyllabus = useSyllabusStore.getState().syllabus;
          if (storeSyllabus && storeSyllabus.units && storeSyllabus.units.length > 0) {
            loadedData = CurriculumService.transformSyllabusToCurriculumModel(storeSyllabus);
          }
        }

        if (!loadedData) {
          loadedData = await CurriculumService.getCurriculumData();
        }

        if (isMounted) {
          setData(loadedData);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load curriculum strategy data');
          setIsLoading(false);
        }
      }
    };

    loadCurriculum();

    return () => {
      isMounted = false;
    };
  }, [selectedSyllabusId]);

  const filteredTopics = useMemo(() => {
    if (!data) return [];

    let topics = (data.units || []).flatMap((unit: any) =>
      (unit.topics || []).map((t: any) => ({
        ...t,
        unitTitle: unit.title,
        unitNumber: unit.unitNumber,
      }))
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      topics = topics.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.unitTitle.toLowerCase().includes(q) ||
          t.pedagogy.toLowerCase().includes(q) ||
          t.subtopics.some((s: any) => String(s).toLowerCase().includes(q))
      );
    }

    if (difficultyFilter !== 'All') {
      topics = topics.filter((t) => t.level.toLowerCase() === difficultyFilter.toLowerCase());
    }

    if (unitFilter !== 'All') {
      const uNum = parseInt(unitFilter.replace('Unit ', ''), 10);
      if (!isNaN(uNum)) {
        topics = topics.filter((t) => t.unitNumber === uNum);
      }
    }

    return topics;
  }, [data, searchQuery, difficultyFilter, unitFilter]);

  return {
    data,
    course: data,
    hierarchy: data?.hierarchy || [],
    topTopics: filteredTopics,
    savedSyllabi,
    filteredTopics,
    isLoading,
    error,
  };
}
