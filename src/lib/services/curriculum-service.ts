export interface CurriculumTopic {
  id: string;
  type: 'course' | 'unit' | 'topic' | 'concept';
  level?: string;
  hierarchyReason?: string;
  title: string;
  description: string;
  difficulty: 'Introductory' | 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'High' | 'Medium' | 'Low';
  learningHours?: number;
  confidence?: number;
  similarTopics?: string[];
  pedagogies?: Array<{
    rank?: number;
    name?: string;
    method?: string;
    bloomLevel?: string;
    reason?: string;
    confidence?: number;
    categoryNumber?: number;
    categoryName?: string;
  }>;
  children?: CurriculumTopic[];
}

export interface CourseDataModel {
  id: string;
  courseName: string;
  code: string;
  department: string;
  credits: number;
  semester: string;
  hours: number;
  theoryHours?: number;
  practicalHours?: number;
  labExperiments?: any[];
  objectives?: any[];
  outcomes?: any[];
  textbooks?: any[];
  references?: any[];
  hierarchy: CurriculumTopic[];
  tables?: Array<{ id: string; category: string; page?: number; headers: string[]; rows: string[][] }>;
}

import { useSyllabusStore } from '@/lib/store';

export class CurriculumService {
  static async fetchCurriculumData(): Promise<CourseDataModel> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const state = useSyllabusStore.getState();
    const syllabus = state.syllabus;

    if (!syllabus || !syllabus.units || syllabus.units.length === 0) {
      return {
        id: syllabus?.id || '',
        courseName: syllabus?.course?.title || '',
        code: syllabus?.course?.code || '',
        department: syllabus?.course?.department || '',
        credits: Number(syllabus?.course?.credits) || 0,
        semester: syllabus?.course?.semester || '',
        hours: Number(syllabus?.course?.hours?.total) || 0,
        hierarchy: [],
      };
    }

    const hierarchy: CurriculumTopic[] = syllabus.units.map((unit, uIdx) => {
      const uNum = unit.unit_number || uIdx + 1;
      const unitHours = Number(unit.hours) || 9;

      const topics: CurriculumTopic[] = (unit.topics || []).map((topic, tIdx) => {
        const subtopicNodes: CurriculumTopic[] = (topic.subtopics || []).map((sub, sIdx) => {
          const subTitle = typeof sub === 'string' ? sub : (sub as any).title || `Subtopic ${sIdx + 1}`;
          return {
            id: `concept-${uNum}-${tIdx + 1}-${sIdx + 1}`,
            type: 'concept',
            level: 'Subtopic',
            hierarchyReason: `Detailed learning component supporting main topic ${topic.name}.`,
            title: subTitle,
            description: `Core subtopic under ${topic.name}`,
            difficulty: 'Intermediate',
            importance: 'Medium',
            learningHours: Math.max(1, Math.round(unitHours / Math.max(1, topic.subtopics.length))),
          };
        });

        const topicBloom = (tIdx % 2 === 0 ? 'Analyze' : 'Apply');

        return {
          id: `topic-${uNum}-${tIdx + 1}`,
          type: 'topic',
          level: topic.level || 'Concept',
          hierarchyReason: topic.hierarchyReason || `Establishes core domain knowledge for ${topic.name}.`,
          title: topic.name,
          description: `Key topic covering ${topic.name}`,
          difficulty: 'Intermediate',
          importance: 'High',
          learningHours: Math.max(2, Math.round(unitHours / Math.max(1, unit.topics.length))),
          confidence: 94,
          pedagogies: [
            {
              rank: 1,
              name: 'Problem-Based Learning',
              method: 'Problem-Based Learning',
              bloomLevel: topicBloom,
              reason: 'This topic involves complex real-world application, so working through case scenarios solidifies understanding faster than passive lectures.',
              confidence: 95
            },
            {
              rank: 2,
              name: 'Worked Examples & Live Coding',
              method: 'Worked Examples & Live Coding',
              bloomLevel: 'Apply',
              reason: 'Step-by-step problem execution helps learners construct operational mental models.',
              confidence: 91
            },
            {
              rank: 3,
              name: 'Gamified Retrieval Practice',
              method: 'Gamified Retrieval Practice',
              bloomLevel: 'Understand',
              reason: 'Reinforces key definitions and architectural concepts through active recall.',
              confidence: 86
            }
          ],
          children: subtopicNodes,
        };
      });

      return {
        id: `unit-${uNum}`,
        type: 'unit',
        level: unit.level || 'Unit',
        unitNumber: uNum,
        hierarchyReason: unit.hierarchyReason || `Curriculum unit establishing module objectives.`,
        title: unit.title || `Unit ${uNum}`,
        description: `Comprehensive module covering ${unit.title || `Unit ${uNum}`}`,
        difficulty: 'Intermediate',
        importance: 'High',
        learningHours: unitHours,
        children: topics,
      };
    });

    return {
      id: syllabus.id || `course_${Date.now()}`,
      courseName: syllabus.course?.title || '',
      code: syllabus.course?.code || '',
      department: syllabus.course?.department || '',
      credits: Number(syllabus.course?.credits) || 0,
      semester: syllabus.course?.semester || '',
      hours: Number(syllabus.course?.hours?.total) || 45,
      hierarchy,
    };
  }

  static filterHierarchy(
    topics: CurriculumTopic[],
    searchQuery: string,
    difficultyFilter: string,
    unitFilter: string = 'All'
  ): CurriculumTopic[] {
    const query = searchQuery.trim().toLowerCase();
    const targetUnit = unitFilter.trim().toLowerCase();

    return topics.reduce<CurriculumTopic[]>((acc, topic) => {
      // Unit level filter check
      if (topic.type === 'unit' && targetUnit !== 'all') {
        const uTitle = topic.title.toLowerCase();
        const matchesUnit =
          uTitle.includes(targetUnit) ||
          (targetUnit === 'unit 1' && (uTitle.includes('unit i') || uTitle.includes('unit 1') || uTitle.includes('module 1'))) ||
          (targetUnit === 'unit 2' && (uTitle.includes('unit ii') || uTitle.includes('unit 2') || uTitle.includes('module 2'))) ||
          (targetUnit === 'unit 3' && (uTitle.includes('unit iii') || uTitle.includes('unit 3') || uTitle.includes('module 3'))) ||
          (targetUnit === 'unit 4' && (uTitle.includes('unit iv') || uTitle.includes('unit 4') || uTitle.includes('module 4'))) ||
          (targetUnit === 'unit 5' && (uTitle.includes('unit v') || uTitle.includes('unit 5') || uTitle.includes('module 5')));

        if (!matchesUnit) return acc;
      }

      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query);

      const matchesDifficulty =
        !difficultyFilter ||
        difficultyFilter === 'All' ||
        topic.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      const filteredChildren = topic.children
        ? this.filterHierarchy(topic.children, searchQuery, difficultyFilter, unitFilter)
        : [];

      if ((matchesSearch && matchesDifficulty) || filteredChildren.length > 0) {
        acc.push({
          ...topic,
          children: filteredChildren.length > 0 ? filteredChildren : topic.children,
        });
      }

      return acc;
    }, []);
  }

  static async fetchCourseFromPostgres(courseId: string): Promise<CourseDataModel | null> {
    try {
      const res = await fetch(`http://localhost:8000/api/courses/${encodeURIComponent(courseId)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id || courseId,
          courseName: data.courseName || data.courseTitle || data.title || courseId,
          code: data.courseCode || data.code || courseId,
          department: data.department || 'Computer Science & Engineering',
          credits: data.credits || 4,
          semester: data.semester || 'Semester V',
          hours: data.totalHours || 45,
          theoryHours: data.theoryHours || 45,
          practicalHours: data.practicalHours || 0,
          labExperiments: data.labExperiments || data.experiments || [],
          hierarchy: (data.units || []).map((u: any, idx: number) => {
            const uNum = u.unitNumber || idx + 1;
            return {
              id: u.unitId || `unit-${uNum}`,
              type: 'unit',
              level: 'Unit',
              title: u.title || `Unit ${uNum}`,
              description: `Module covering ${u.title}`,
              difficulty: 'Intermediate',
              importance: 'High',
              learningHours: u.learningHours || 9,
              children: (u.topics || []).map((t: any, tIdx: number) => ({
                id: t.id || `t-${uNum}-${tIdx+1}`,
                type: 'topic',
                level: 'Concept',
                title: typeof t === 'string' ? t : t.title,
                description: `Topic covering ${typeof t === 'string' ? t : t.title}`,
                difficulty: 'Intermediate',
                importance: 'High',
                subtopics: t.subtopics || []
              }))
            };
          })
        };
      }
    } catch (err) {
      console.warn('Failed to fetch course from PostgreSQL:', err);
    }
    return null;
  }

  static async generateHierarchyWithOpenAI(payload: {
    courseCode?: string;
    courseTitle?: string;
    unit?: string;
    topics: string[];
  }): Promise<any> {
    try {
      const res = await fetch('http://localhost:8000/api/generate-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error generating hierarchy with OpenAI:', err);
    }
    return null;
  }
}

