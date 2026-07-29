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
  units?: any[];
  tables?: Array<{ id: string; category: string; page?: number; headers: string[]; rows: string[][] }>;
}

import { useSyllabusStore } from '@/stores';
import { curriculumApi } from '@/lib/api';

export class CurriculumService {
  static createDefaultSyllabusForCourse(courseCode: string) {
    const cleanCode = (courseCode || 'COURSE101').toUpperCase().trim();
    
    const knownTitles: Record<string, string> = {
      'CE3022': 'REMOTE SENSING CONCEPTS',
      'GE3451': 'ENVIRONMENTAL SCIENCES AND SUSTAINABILITY',
      'CS3451': 'OPERATING SYSTEMS',
      'CS3491': 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING',
      'CS3591': 'COMPUTER NETWORKS',
      'CS3691': 'EMBEDDED SYSTEMS AND IOT',
    };

    const title = knownTitles[cleanCode] || `${cleanCode}: CORE CURRICULUM CONCEPTS`;

    return {
      id: cleanCode,
      courseCode: cleanCode,
      courseName: title,
      department: 'Computer Science & Engineering',
      semester: 'Semester V',
      credits: 4,
      hours: 45,
      totalHours: 45,
      course: {
        id: cleanCode,
        code: cleanCode,
        title: title,
        department: 'Computer Science & Engineering',
        semester: 'Semester V',
        credits: 4,
        hours: { total: 45 },
      },
      objectives: [
        `Understand the fundamental principles, theoretical models, and architecture of ${title}.`,
        `Analyze core operational processes, algorithmic structures, and system design patterns.`,
        `Evaluate computational efficiency, tradeoffs, and system boundaries in ${cleanCode}.`,
        `Apply problem-solving strategies and hands-on methodologies to real-world domain scenarios.`,
        `Design and implement scalable modular solutions aligning with professional engineering standards.`
      ],
      outcomes: [
        `CO1: Explain basic principles and architectural foundations of ${title}.`,
        `CO2: Formulate mathematical models and computational workflows for domain problems.`,
        `CO3: Analyze design trade-offs, optimization techniques, and performance metrics.`,
        `CO4: Synthesize multi-component solutions integrating core theoretical frameworks.`,
        `CO5: Demonstrate technical proficiency through structured case studies and exercises.`
      ],
      textbooks: [
        `Primary Author, "${title}: Fundamentals and Applications", 4th Edition, Academic Press, 2023.`,
        `Secondary Author, "System Design & Analytical Principles of ${cleanCode}", Pearson Education, 2022.`
      ],
      references: [
        `Reference Author, "Advanced Topics in ${title}", McGraw-Hill Higher Education, 2021.`
      ],
      units: [
        {
          unit_number: 1,
          unitNumber: 1,
          title: `Unit I: Principles & Theoretical Foundations of ${title}`,
          hours: 10,
          learningHours: 10,
          topics: [
            {
              title: `Fundamental Concepts & Architecture of ${cleanCode}`,
              name: `Fundamental Concepts & Architecture of ${cleanCode}`,
              level: 'Introductory',
              subtopics: [
                `Historical Evolution & Scope of ${cleanCode}`,
                `Core Structural Definitions & Theoretical Models`,
                `System Classifications & Operational Boundaries`
              ]
            },
            {
              title: `Mathematical & Formal Frameworks`,
              name: `Mathematical & Formal Frameworks`,
              level: 'Intermediate',
              subtopics: [
                `Analytical Formulations & Vector Representations`,
                `Boundary Conditions & Domain Constraints`,
                `Error Metrics & Signal Interpretation`
              ]
            }
          ]
        },
        {
          unit_number: 2,
          unitNumber: 2,
          title: `Unit II: Data Structures & Execution Mechanics`,
          hours: 10,
          learningHours: 10,
          topics: [
            {
              title: `Data Acquisition & Representation Schemes`,
              name: `Data Acquisition & Representation Schemes`,
              level: 'Intermediate',
              subtopics: [
                `Sensor Interfaces & Data Sampling Rules`,
                `Transformation Pipelines & Normalization`,
                `Spatial & Temporal Feature Encoding`
              ]
            },
            {
              title: `Algorithmic Workflows & Processing Pipeline`,
              name: `Algorithmic Workflows & Processing Pipeline`,
              level: 'Intermediate',
              subtopics: [
                `Stage 1 Pre-processing & Noise Reduction`,
                `Feature Extraction & Dimensionality Reduction`,
                `Classification Algorithms & Pattern Recognition`
              ]
            }
          ]
        },
        {
          unit_number: 3,
          unitNumber: 3,
          title: `Unit III: System Modeling & Optimization Strategy`,
          hours: 9,
          learningHours: 9,
          topics: [
            {
              title: `Computational Modeling & Subsystem Integration`,
              name: `Computational Modeling & Subsystem Integration`,
              level: 'Intermediate',
              subtopics: [
                `State-Space Modeling & Dependency Graphs`,
                `Resource Allocation & Queueing Management`,
                `Interface Protocols & Communication Channels`
              ]
            },
            {
              title: `Optimization Algorithms & Tradeoff Analysis`,
              name: `Optimization Algorithms & Tradeoff Analysis`,
              level: 'Advanced',
              subtopics: [
                `Performance Benchmarking & Complexity Analysis`,
                `Latency & Bandwidth Bottleneck Resolution`,
                `Heuristic Search & Dynamic Programming Methods`
              ]
            }
          ]
        },
        {
          unit_number: 4,
          unitNumber: 4,
          title: `Unit IV: Advanced Applications & Domain Case Studies`,
          hours: 8,
          learningHours: 8,
          topics: [
            {
              title: `Industrial & Real-world Implementation Patterns`,
              name: `Industrial & Real-world Implementation Patterns`,
              level: 'Advanced',
              subtopics: [
                `Enterprise Architecture Integration`,
                `Fault-Tolerance & Resilience Mechanisms`,
                `Security Protocols & Data Integrity Checks`
              ]
            },
            {
              title: `Domain Case Studies & Empirical Evaluation`,
              name: `Domain Case Studies & Empirical Evaluation`,
              level: 'Advanced',
              subtopics: [
                `Case Study 1: Large-scale Urban & Terrain Analysis`,
                `Case Study 2: Real-Time Event Monitoring`,
                `Comparative Performance Breakdown`
              ]
            }
          ]
        },
        {
          unit_number: 5,
          unitNumber: 5,
          title: `Unit V: Emerging Trends & Future Innovations`,
          hours: 8,
          learningHours: 8,
          topics: [
            {
              title: `AI & Machine Learning Integration in ${title}`,
              name: `AI & Machine Learning Integration in ${title}`,
              level: 'Advanced',
              subtopics: [
                `Deep Neural Networks for Automated Analytics`,
                `Hyperspectral & Multi-modal Data Fusion`,
                `Generative Modeling & Synthetic Data Augmentation`
              ]
            },
            {
              title: `Future Paradigms & Research Directions`,
              name: `Future Paradigms & Research Directions`,
              level: 'Advanced',
              subtopics: [
                `Edge Computing & Cloud Orchestration`,
                `Next-Gen Sensor Hardware & Quantum Sensing`,
                `Standards, Ethics, & Environmental Impact`
              ]
            }
          ]
        }
      ]
    };
  }

  static transformSyllabusToCurriculumModel(syllabus: any): CourseDataModel {
    if (!syllabus || !syllabus.units) {
      return {
        id: syllabus?.id || '',
        courseName: syllabus?.course?.title || syllabus?.courseName || syllabus?.courseTitle || '',
        code: syllabus?.course?.code || syllabus?.courseCode || syllabus?.code || '',
        department: syllabus?.course?.department || syllabus?.department || '',
        credits: Number(syllabus?.course?.credits || syllabus?.credits) || 0,
        semester: syllabus?.course?.semester || syllabus?.semester || '',
        hours: Number(syllabus?.course?.hours?.total || syllabus?.totalHours || syllabus?.hours) || 0,
        hierarchy: [],
        units: [],
      };
    }

    const cCode = syllabus.courseCode || syllabus.code || syllabus.course?.code || 'COURSE';
    const cTitle = syllabus.courseName || syllabus.courseTitle || syllabus.title || syllabus.course?.title || 'Course Syllabus';

    const units = syllabus.units.map((unit: any, uIdx: number) => {
      const uNum = unit.unit_number || unit.unitNumber || uIdx + 1;
      const unitHours = Number(unit.hours || unit.learningHours) || 9;
      return {
        unitNumber: uNum,
        title: unit.title || `Unit ${uNum}`,
        hours: unitHours,
        topics: (unit.topics || []).map((t: any, tIdx: number) => ({
          id: `topic-${uNum}-${tIdx + 1}`,
          name: typeof t === 'string' ? t : t.name || t.title || 'Topic',
          subtopics: ((t.subtopics || []).map((s: any) => (typeof s === 'string' ? s : s.title || s.name || ''))),
          level: (typeof t === 'object' && t.level) || 'Intermediate',
          pedagogy: (tIdx % 2 === 0 ? 'Problem-Based Learning' : 'Interactive Discussion'),
          hours: Math.max(2, Math.round(unitHours / Math.max(1, (unit.topics || []).length))),
        })),
      };
    });

    const hierarchy: CurriculumTopic[] = syllabus.units.map((unit: any, uIdx: number) => {
      const uNum = unit.unit_number || unit.unitNumber || uIdx + 1;
      const unitHours = Number(unit.hours || unit.learningHours) || 9;

      const topics: CurriculumTopic[] = (unit.topics || []).map((topic: any, tIdx: number) => {
        const subtopicList = topic.subtopics || [];
        const subtopicNodes: CurriculumTopic[] = subtopicList.map((sub: any, sIdx: number) => {
          const subTitle = typeof sub === 'string' ? sub : sub.title || sub.name || `Subtopic ${sIdx + 1}`;
          return {
            id: `concept-${uNum}-${tIdx + 1}-${sIdx + 1}`,
            type: 'concept',
            level: 'Subtopic',
            hierarchyReason: `Detailed learning component supporting main topic ${typeof topic === 'string' ? topic : topic.name || topic.title}.`,
            title: subTitle,
            description: `Core subtopic under ${typeof topic === 'string' ? topic : topic.name || topic.title}`,
            difficulty: 'Intermediate',
            importance: 'Medium',
            learningHours: Math.max(1, Math.round(unitHours / Math.max(1, subtopicList.length))),
          };
        });

        const topicTitle = typeof topic === 'string' ? topic : topic.name || topic.title || `Topic ${tIdx + 1}`;

        return {
          id: `topic-${uNum}-${tIdx + 1}`,
          type: 'topic',
          level: (typeof topic === 'object' && topic.level) || 'Concept',
          hierarchyReason: (typeof topic === 'object' && topic.hierarchyReason) || `Establishes core domain knowledge for ${topicTitle}.`,
          title: topicTitle,
          description: `Key topic covering ${topicTitle}`,
          difficulty: 'Intermediate',
          importance: 'High',
          learningHours: Math.max(2, Math.round(unitHours / Math.max(1, (unit.topics || []).length))),
          children: subtopicNodes,
        };
      });

      return {
        id: `unit-${uNum}`,
        type: 'unit',
        level: 'Unit',
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
      id: syllabus.id || cCode,
      courseName: cTitle,
      code: cCode,
      department: syllabus.department || syllabus.course?.department || 'Computer Science & Engineering',
      credits: Number(syllabus.credits || syllabus.course?.credits) || 4,
      semester: syllabus.semester || syllabus.course?.semester || 'Semester V',
      hours: Number(syllabus.totalHours || syllabus.hours?.total || syllabus.hours) || 45,
      hierarchy,
      units,
    };
  }

  static async getCurriculumData(): Promise<CourseDataModel> {
    return this.fetchCurriculumData();
  }

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
        units: [],
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

        const topicBloom = tIdx % 2 === 0 ? 'Analyze' : 'Apply';

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
              confidence: 95,
            },
            {
              rank: 2,
              name: 'Worked Examples & Live Coding',
              method: 'Worked Examples & Live Coding',
              bloomLevel: 'Apply',
              reason: 'Step-by-step problem execution helps learners construct operational mental models.',
              confidence: 91,
            },
            {
              rank: 3,
              name: 'Gamified Retrieval Practice',
              method: 'Gamified Retrieval Practice',
              bloomLevel: 'Understand',
              reason: 'Reinforces key definitions and architectural concepts through active recall.',
              confidence: 86,
            },
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
      const data = await curriculumApi.fetchCourseFromPostgres(courseId);
      if (data) {
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
                id: t.id || `t-${uNum}-${tIdx + 1}`,
                type: 'topic',
                level: 'Concept',
                title: typeof t === 'string' ? t : t.title,
                description: `Topic covering ${typeof t === 'string' ? t : t.title}`,
                difficulty: 'Intermediate',
                importance: 'High',
                subtopics: t.subtopics || [],
              })),
            };
          }),
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
      return await curriculumApi.generateHierarchy(payload);
    } catch (err) {
      console.warn('Error generating hierarchy with OpenAI:', err);
    }
    return null;
  }
}
