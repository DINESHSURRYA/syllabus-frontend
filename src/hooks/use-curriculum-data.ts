"use client";

import { useState, useEffect, useMemo } from 'react';
import { CurriculumService, CourseDataModel, CurriculumTopic } from '@/lib/services/curriculum-service';
import { useSyllabusStore, normalizeSyllabusToStoreData } from '@/lib/store';

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

  // Fetch saved syllabi list from backend
  useEffect(() => {
    let isMounted = true;

    const fetchSyllabi = async () => {
      try {
        let rawRes = await fetch('http://localhost:8000/api/syllabus/saved');
        if (!rawRes.ok) {
          rawRes = await fetch('http://localhost:8000/api/syllabus');
        }
        if (rawRes.ok) {
          const resData = await rawRes.json();
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
                  updatedAt: c.updatedAt || c.timestamp || c.createdAt || new Date().toISOString()
                });
              }
            });

            setSavedSyllabi(formatted);

            // Clean up stale/deleted syllabus from Zustand store and localStorage
            const currentStoreSyllabus = useSyllabusStore.getState().syllabus;
            if (formatted.length > 0 && currentStoreSyllabus && (currentStoreSyllabus.id || currentStoreSyllabus.course?.code)) {
              const storeId = (currentStoreSyllabus.id || currentStoreSyllabus.course?.code || '').trim().toLowerCase();
              const isStillValid = formatted.some(s => s.id.toLowerCase() === storeId || s.code.toLowerCase() === storeId);
              if (!isStillValid) {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('active_saved_syllabus');
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Backend saved syllabi fetch fallback:', err);
      }
    };

    fetchSyllabi();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch active curriculum data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCurriculum = async () => {
      try {
        let targetId = selectedSyllabusId;
        const currentStoreSyllabus = useSyllabusStore.getState().syllabus;

        // If targetId is not in savedSyllabi (e.g. deleted), fallback to first available saved syllabus
        if (targetId && savedSyllabi.length > 0 && !savedSyllabi.some(s => s.id === targetId || s.code === targetId)) {
          targetId = savedSyllabi[0].id;
        }
        if (!targetId && savedSyllabi.length > 0) {
          targetId = savedSyllabi[0].id;
        }
        if (!targetId && currentStoreSyllabus && currentStoreSyllabus.units && currentStoreSyllabus.units.length > 0) {
          const storeId = currentStoreSyllabus.id || currentStoreSyllabus.course?.code || '';
          if (savedSyllabi.length === 0 || savedSyllabi.some(s => s.id === storeId || s.code === storeId)) {
            targetId = storeId;
          }
        }

        if (targetId) {
          // 1. Fetch course directly from PostgreSQL database route
          const pgRes = await fetch(`http://localhost:8000/api/courses/${encodeURIComponent(targetId)}`);
          if (pgRes.ok) {
            const pgData = await pgRes.json();
            if (isMounted && pgData && pgData.units) {
              const formattedHierarchy: CurriculumTopic[] = (pgData.units || []).map((u: any, idx: number) => {
                const uNum = u.unitNumber || idx + 1;
                const unitHours = Number(u.learningHours || u.hours) || 9;
                const rawTopics = Array.isArray(u.topics) ? u.topics : [];

                const topics: CurriculumTopic[] = rawTopics.map((t: any, tIdx: number) => {
                  const tTitle = typeof t === 'string' ? t : (t.title || t.name || `Topic ${tIdx + 1}`);
                  const rawSubs = typeof t === 'object' && Array.isArray(t.subtopics) ? t.subtopics : [];

                  const subtopicNodes: CurriculumTopic[] = rawSubs.map((sub: any, sIdx: number) => {
                    const subTitle = typeof sub === 'string' ? sub : (sub.title || sub.name || `Subtopic ${sIdx + 1}`);
                    return {
                      id: (typeof sub === 'object' && sub.id) || `concept-${uNum}-${tIdx + 1}-${sIdx + 1}`,
                      type: 'concept',
                      level: 'Subtopic',
                      title: subTitle,
                      description: `Core subtopic under ${tTitle}`,
                      difficulty: 'Intermediate',
                      importance: 'Medium',
                      learningHours: Math.max(1, Math.round(unitHours / Math.max(1, rawSubs.length))),
                    };
                  });

                  return {
                    id: (typeof t === 'object' && t.id) || `topic-${uNum}-${tIdx + 1}`,
                    type: 'topic',
                    level: (typeof t === 'object' && t.level) || 'Concept',
                    title: tTitle,
                    description: (typeof t === 'object' && t.description) || `Key topic covering ${tTitle}`,
                    difficulty: 'Intermediate',
                    importance: 'High',
                    learningHours: Math.max(2, Math.round(unitHours / Math.max(1, rawTopics.length))),
                    confidence: 94,
                    children: subtopicNodes,
                  };
                });

                return {
                  id: u.unitId || `unit-${uNum}`,
                  type: 'unit',
                  level: 'Unit',
                  unitNumber: uNum,
                  title: u.title || `Unit ${uNum}`,
                  description: `Module covering ${u.title || `Unit ${uNum}`}`,
                  difficulty: 'Intermediate',
                  importance: 'High',
                  learningHours: unitHours,
                  rawTopicNames: u.rawTopicNames || [],
                  children: topics,
                };
              });

              setData({
                id: pgData.id || targetId,
                courseName: pgData.courseName || pgData.courseTitle || pgData.title || 'Course',
                code: pgData.courseCode || pgData.code || targetId,
                department: pgData.department || 'Engineering & Technology',
                credits: Number(pgData.credits) || 4,
                semester: pgData.semester || 'Semester V',
                hours: Number(pgData.totalHours) || 45,
                theoryHours: Number(pgData.theoryHours) || 45,
                practicalHours: Number(pgData.practicalHours) || 0,
                labExperiments: pgData.labExperiments || pgData.experiments || [],
                objectives: pgData.objectives || [],
                outcomes: pgData.outcomes || [],
                textbooks: pgData.textbooks || [],
                references: pgData.references || [],
                tables: pgData.tables || [],
                hierarchy: formattedHierarchy
              });
              setIsLoading(false);
              return;
            }
          }

          // 2. Fallback check for hierarchy endpoint
          const res = await fetch(`http://localhost:8000/api/curriculum/${encodeURIComponent(targetId)}/hierarchy`);
          if (res.ok) {
            const resData = await res.json();
            if (isMounted && resData && resData.hierarchy) {
              setData({
                id: resData.courseId || targetId,
                courseName: resData.courseTitle || resData.courseName || 'Course',
                code: resData.courseCode || targetId,
                department: resData.department || 'Engineering & Technology',
                credits: resData.credits || 4,
                semester: resData.semester || 'Semester V',
                hours: resData.totalHours || 45,
                theoryHours: resData.theoryHours || 45,
                practicalHours: resData.practicalHours || 0,
                labExperiments: resData.labExperiments || resData.experiments || [],
                objectives: resData.objectives || [],
                outcomes: resData.outcomes || [],
                textbooks: resData.textbooks || [],
                references: resData.references || [],
                tables: resData.tables || [],
                hierarchy: resData.hierarchy || []
              });
              setIsLoading(false);
              return;
            }
          }
        }

        // If no PostgreSQL syllabus loaded, check Zustand store for uploaded/saved syllabus
        const model = await CurriculumService.fetchCurriculumData();
        if (isMounted && model && model.hierarchy && model.hierarchy.length > 0) {
          setData(model);
        } else if (isMounted) {
          setData(null);
        }
        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load curriculum');
          setData(null);
          setIsLoading(false);
        }
      }
    };

    loadCurriculum();

    return () => {
      isMounted = false;
    };
  }, [selectedSyllabusId, savedSyllabi]);

  const filteredHierarchy = useMemo(() => {
    if (!data?.hierarchy) return [];
    let list = CurriculumService.filterHierarchy(data.hierarchy, searchQuery, difficultyFilter, unitFilter);

    // Sorting logic
    if (sortBy === 'Alphabetical A-Z') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [data, searchQuery, difficultyFilter, unitFilter, sortBy]);

  const topTopics = useMemo(() => {
    if (!data?.hierarchy) return [];
    const topicsList: CurriculumTopic[] = [];

    const extractTopics = (list: CurriculumTopic[]) => {
      list.forEach((item) => {
        if (item.type === 'topic' && item.pedagogies && item.pedagogies.length > 0) {
          topicsList.push(item);
        }
        if (item.children) extractTopics(item.children);
      });
    };

    extractTopics(data.hierarchy);
    return topicsList;
  }, [data]);

  return {
    course: data,
    savedSyllabi,
    hierarchy: filteredHierarchy,
    tables: data?.tables || [],
    topTopics,
    isLoading,
    error,
    isEmpty: !isLoading && filteredHierarchy.length === 0,
  };
}

