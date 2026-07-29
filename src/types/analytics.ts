import { BloomLevel } from './mcq';

export interface BloomTaxonomyMetric {
  level: BloomLevel;
  label: string;
  count: number;
  percentage: number;
}

export interface CourseOutcomeCoverage {
  coCode: string;
  statement: string;
  mappedUnitsCount: number;
  mappedPoCount: number;
  coveragePercentage: number;
}

export interface OverallAnalyticsSummary {
  totalSyllabi: number;
  totalCourses: number;
  averageCoPoMappingScore: number;
  bloomDistribution: BloomTaxonomyMetric[];
  coCoverageList: CourseOutcomeCoverage[];
}
