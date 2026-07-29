"use client";

import { useState, useEffect, useMemo } from 'react';
import { CurriculumService, CourseDataModel, CurriculumTopic } from '@/lib/services/curriculum-service';
import { useSyllabusStore } from '@/stores';
import { client, API, curriculumApi, syllabusApi } from '@/lib/api';

/**
 * useCurriculumData — DB-First Curriculum Hook
 * Priority order:
 *   1. /api/curriculum/hierarchy?syllabusId=X → Full enriched tree (DB cache or AI-generated + saved)
 *   2. /api/courses/{id}                       → Raw course data fallback
 *   3. Zustand store                            → In-session data fallback
 */
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

  // ── Fetch saved syllabi list from backend ──
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

        if (resData && isMounted) {
          const courseList = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.items)
            ? resData.items
            : [];

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

          setSavedSyllabi(formatted);
        }
      } catch (err) {
        console.warn('Backend saved syllabi fetch fallback:', err);
      }
    };

    fetchSyllabi();
    return () => { isMounted = false; };
  }, []);

  // ── Fetch active curriculum — DB-First ──
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCurriculum = async () => {
      try {
        let targetId = selectedSyllabusId;
        const currentStoreSyllabus = useSyllabusStore.getState().syllabus;

        if (targetId && savedSyllabi.length > 0 && !savedSyllabi.some((s) => s.id === targetId || s.code === targetId)) {
          targetId = savedSyllabi[0].id;
        }
        if (!targetId && savedSyllabi.length > 0) {
          targetId = savedSyllabi[0].id;
        }
        if (!targetId && currentStoreSyllabus?.units?.length) {
          targetId = currentStoreSyllabus.id || currentStoreSyllabus.course?.code || '';
        }

        if (targetId) {
          // ── STEP 1: DB-First — Call /api/curriculum/hierarchy ──
          // This endpoint checks PostgreSQL hierarchicalTreeData first,
          // returns instantly if cached, or generates + saves to DB if not.
          try {
            const htData = await curriculumApi.getCurriculumHierarchy(targetId);

            if (isMounted && htData && (htData.units?.length > 0 || htData.hierarchy?.length > 0)) {
              const formattedData = _buildCourseDataModelFromHierarchy(htData, targetId);
              setData(formattedData);
              setIsLoading(false);
              return;
            }
          } catch (htErr) {
            console.warn('[useCurriculumData] Hierarchy endpoint fallback:', htErr);
          }

          // ── STEP 2: Fallback — /api/courses/{id} raw course data ──
          try {
            const pgData = await curriculumApi.fetchCourseFromPostgres(targetId);
            if (isMounted && pgData && pgData.units) {
              const formattedData = _buildCourseDataModelFromRaw(pgData, targetId);
              setData(formattedData);
              setIsLoading(false);
              return;
            }
          } catch {
            // continue to store fallback
          }
        }

        // ── STEP 3: Zustand store fallback ──
        const model = await CurriculumService.fetchCurriculumData();
        if (isMounted && model?.hierarchy?.length) {
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
    return () => { isMounted = false; };
  }, [selectedSyllabusId, savedSyllabi]);

  const filteredHierarchy = useMemo(() => {
    if (!data?.hierarchy) return [];
    let list = CurriculumService.filterHierarchy(data.hierarchy, searchQuery, difficultyFilter, unitFilter);
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

// ─────────────────────────────────────────────────────────────────────────────
// Build CourseDataModel from the full hierarchy endpoint response
// The hierarchy endpoint returns: { units: [...], courseCode, courseName, ... }
// Each unit has: { unitNumber, unitTitle, topics: [{ title, bloomLevel, estimatedHours, subtopics, top3Pedagogies }] }
// ─────────────────────────────────────────────────────────────────────────────

function _buildCourseDataModelFromHierarchy(htData: any, fallbackId: string): CourseDataModel {
  const units = htData.units || htData.hierarchy || [];

  const hierarchy: CurriculumTopic[] = units.map((u: any, idx: number) => {
    const uNum = u.unitNumber || u.unit_number || idx + 1;
    const uTitle = u.unitTitle || u.title || `Unit ${uNum}`;
    const uHours = Number(u.learningHours || u.totalHours || u.hours) || 9;

    const topics: CurriculumTopic[] = (u.topics || u.children || []).map((t: any, tIdx: number) => {
      const tTitle = typeof t === 'string' ? t : t.title || t.name || `Topic ${tIdx + 1}`;
      const tBloom = t.bloomLevel || 'Understand';
      const tHours = Number(t.estimatedHours || t.learningHours) || Math.round(uHours / Math.max(1, (u.topics || []).length));
      const tId = t.id || `topic-${uNum}-${tIdx + 1}`;

      // Map top3Pedagogies for the board
      const peds: string[] = (t.top3Pedagogies || []).map((p: any) =>
        typeof p === 'string' ? p : p.pedagogyName || p.name || 'Active Learning'
      );

      const subtopics: CurriculumTopic[] = (t.subtopics || []).map((sub: any, sIdx: number) => ({
        id: sub.id || `sub-${uNum}-${tIdx + 1}-${sIdx + 1}`,
        type: 'concept' as const,
        level: 'Subtopic',
        title: typeof sub === 'string' ? sub : sub.title || `Subtopic ${sIdx + 1}`,
        description: sub.hierarchyReason || `Component of ${tTitle}`,
        difficulty: 'Beginner',
        importance: 'Medium',
        learningHours: Number(sub.estimatedHours) || 1,
        bloomLevel: sub.bloomLevel || 'Remember',
        hierarchyReason: sub.hierarchyReason || '',
        concepts: sub.concepts || [],
        parentId: tId,
      }));

      return {
        id: tId,
        type: 'topic' as const,
        level: 'Topic',
        unitNumber: uNum,
        title: tTitle,
        description: t.hierarchyReason || t.description || `Core topic: ${tTitle}`,
        difficulty: t.difficulty || 'Intermediate',
        importance: 'High',
        learningHours: tHours,
        bloomLevel: tBloom,
        confidence: 95,
        teachingOrder: t.teachingOrder || tIdx + 1,
        hierarchyReason: t.hierarchyReason || '',
        prerequisites: t.prerequisites || [],
        learningOutcome: t.learningOutcome || '',
        pedagogies: peds,
        top3Pedagogies: t.top3Pedagogies || [],
        children: subtopics,
        rawTopicNames: [],
      };
    });

    return {
      id: u.unitId || u.id || `unit-${uNum}`,
      type: 'unit' as const,
      level: 'Unit',
      unitNumber: uNum,
      title: uTitle,
      description: u.hierarchyReason || `Unit ${uNum}: ${uTitle}`,
      difficulty: 'Intermediate',
      importance: 'High',
      learningHours: uHours,
      hierarchyReason: u.hierarchyReason || '',
      teachingOrder: u.teachingOrder || idx + 1,
      rawTopicNames: (u.topics || []).map((t: any) => (typeof t === 'string' ? t : t.title || '')).filter(Boolean),
      children: topics,
    };
  });

  const sumUnitHours = hierarchy.reduce((sum, u) => sum + (Number(u.learningHours) || 0), 0);
  const totalCourseHours = Number(htData.totalHours || htData.course?.totalHours || htData.course?.hours || htData.total_hours) || (sumUnitHours > 0 ? sumUnitHours : 45);

  return {
    id: htData.courseCode || htData.syllabusId || fallbackId,
    courseName: htData.courseName || htData.courseTitle || 'Course',
    code: htData.courseCode || fallbackId,
    department: htData.department || 'Engineering & Technology',
    credits: Number(htData.credits) || 4,
    semester: htData.semester || 'Semester V',
    hours: totalCourseHours,
    theoryHours: Number(htData.theoryHours || htData.totalHours) || totalCourseHours,
    practicalHours: Number(htData.practicalHours) || 0,
    labExperiments: htData.labExperiments || [],
    objectives: htData.objectives || [],
    outcomes: htData.outcomes || [],
    textbooks: htData.textbooks || [],
    references: htData.references || [],
    tables: htData.tables || [],
    hierarchy,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build CourseDataModel from raw /api/courses/{id} response (fallback)
// ─────────────────────────────────────────────────────────────────────────────

function _buildCourseDataModelFromRaw(pgData: any, fallbackId: string): CourseDataModel {
  const hierarchy: CurriculumTopic[] = (pgData.units || []).map((u: any, idx: number) => {
    const uNum = u.unitNumber || idx + 1;
    const unitHours = Number(u.learningHours || u.hours) || 9;
    const rawTopics = Array.isArray(u.topics) ? u.topics : [];

    const topics: CurriculumTopic[] = rawTopics.map((t: any, tIdx: number) => {
      const tTitle = typeof t === 'string' ? t : t.title || t.name || `Topic ${tIdx + 1}`;
      const rawSubs = typeof t === 'object' && Array.isArray(t.subtopics) ? t.subtopics : [];

      const subtopicNodes: CurriculumTopic[] = rawSubs.map((sub: any, sIdx: number) => ({
        id: (typeof sub === 'object' && sub.id) || `concept-${uNum}-${tIdx + 1}-${sIdx + 1}`,
        type: 'concept' as const,
        level: 'Subtopic',
        title: typeof sub === 'string' ? sub : sub.title || sub.name || `Subtopic ${sIdx + 1}`,
        description: `Core subtopic under ${tTitle}`,
        difficulty: 'Intermediate' as const,
        importance: 'Medium' as const,
        learningHours: Math.max(1, Math.round(unitHours / Math.max(1, rawSubs.length))),
      }));

      return {
        id: (typeof t === 'object' && t.id) || `topic-${uNum}-${tIdx + 1}`,
        type: 'topic' as const,
        level: 'Topic',
        unitNumber: uNum,
        title: tTitle,
        description: (typeof t === 'object' && t.description) || `Key topic: ${tTitle}`,
        difficulty: 'Intermediate' as const,
        importance: 'High' as const,
        learningHours: Math.max(2, Math.round(unitHours / Math.max(1, rawTopics.length))),
        confidence: 94,
        children: subtopicNodes,
        rawTopicNames: [],
      };
    });

    return {
      id: u.unitId || `unit-${uNum}`,
      type: 'unit' as const,
      level: 'Unit',
      unitNumber: uNum,
      title: u.title || `Unit ${uNum}`,
      description: `Module covering ${u.title || `Unit ${uNum}`}`,
      difficulty: 'Intermediate' as const,
      importance: 'High' as const,
      learningHours: unitHours,
      rawTopicNames: u.rawTopicNames || rawTopics.map((t: any) => (typeof t === 'string' ? t : t.title || '')).filter(Boolean),
      children: topics,
    };
  });

  const sumUnitHours = hierarchy.reduce((sum, u) => sum + (Number(u.learningHours) || 0), 0);
  const totalCourseHours = Number(pgData.totalHours || pgData.course?.totalHours || pgData.course?.hours || pgData.total_hours || pgData.data?.totalHours || pgData.data?.course?.totalHours) || (sumUnitHours > 0 ? sumUnitHours : 45);

  return {
    id: pgData.id || fallbackId,
    courseName: pgData.courseName || pgData.courseTitle || pgData.title || 'Course',
    code: pgData.courseCode || pgData.code || fallbackId,
    department: pgData.department || 'Engineering & Technology',
    credits: Number(pgData.credits) || 4,
    semester: pgData.semester || 'Semester V',
    hours: totalCourseHours,
    theoryHours: Number(pgData.theoryHours) || totalCourseHours,
    practicalHours: Number(pgData.practicalHours) || 0,
    labExperiments: pgData.labExperiments || pgData.experiments || [],
    objectives: pgData.objectives || [],
    outcomes: pgData.outcomes || [],
    textbooks: pgData.textbooks || [],
    references: pgData.references || [],
    tables: pgData.tables || [],
    hierarchy,
  };
}
