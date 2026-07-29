/**
 * API Client Bridge
 * Forwards all calls to the centralized API architecture at '@/lib/api'
 */

export {
  uploadSyllabusFile,
  generateTimeline,
  getAnalyticsDashboard,
  searchCurriculum,
  getTopicDetails,
  getBackendSettings,
  updateBackendSettings,
  getSyllabusList,
  checkDuplicateSyllabus,
  updateSyllabusRepository,
  deleteSyllabusRepository,
  restoreSyllabusRepository,
  permanentDeleteSyllabusRepository,
  emptyRecycleBinRepository,
  bulkDeleteRecycleBinRepository,
  bulkRestoreRecycleBinRepository,
  getSyllabusVersions,
  restoreSyllabusVersion,
  deleteSyllabusVersion,
  verifySyllabusRepository,
  getSyllabusDownloadUrl,
  checkCourseCodeExists,
  getOriginalFileUrl,
  getCurriculumHierarchy,
  startExtraction,
  getProcessingStatus,
  processSyllabus,
  getSyllabus,
  saveVerifiedSyllabus,
  getSyllabusTimeline,
  uploadAndExtractSyllabusBackend,
  generateCoPoMapping,
} from './api';
