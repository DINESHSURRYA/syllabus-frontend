/**
 * Evaluator Phase 3 API Client
 * Connects directly to the Phase 3 FastAPI Evaluator Backend (running on port 8001).
 */

const EVALUATOR_API_BASE =
  process.env.NEXT_PUBLIC_EVALUATOR_API_URL || 'http://127.0.0.1:8001';

const PHASE2_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

export interface StartInterviewParams {
  context_id?: string;
  candidate_id?: string;
  attempt_id?: string;
  json_payload?: any;
}

export interface SubmitAnswerParams {
  thread_id: string;
  student_answer: string;
  time_taken_seconds?: number;
}

export interface IngestPhase2Params {
  submission_id?: string;
  candidate_id?: string;
  assessment_id?: string;
  attempt_id?: string;
  payload?: any;
}

export const evaluatorApi = {
  /**
   * Fetch candidate presets and completed tests from Phase 2 PostgreSQL database
   */
  async getCandidatePresets() {
    try {
      const res = await fetch(`${PHASE2_API_BASE}/api/evaluator/presets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) return res.json();
    } catch (err) {
      console.warn('Phase 2 presets endpoint fallback:', err);
    }
    // Fallback to Phase 3 candidate list if Phase 2 endpoint unavailable
    const url = new URL(`${EVALUATOR_API_BASE}/api/evaluator/phase2/candidates`);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch candidates: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Export candidate assessment attempt into exact Phase 3 JSON format
   */
  async exportAttempt(attemptId: string) {
    const res = await fetch(`${PHASE2_API_BASE}/api/evaluator/export-attempt/${attemptId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to export attempt ${attemptId}: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Fetch candidates from Phase 2 / PostgreSQL via Phase 3 backend
   */
  async getCandidates(query?: string) {
    const url = new URL(`${EVALUATOR_API_BASE}/api/evaluator/phase2/candidates`);
    if (query) url.searchParams.set('query', query);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch candidates: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Upload JSON Assessment File
   */
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${EVALUATOR_API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'File upload failed');
    }
    return res.json();
  },

  /**
   * Ingest raw JSON assessment payload
   */
  async uploadJson(data: any) {
    const res = await fetch(`${EVALUATOR_API_BASE}/upload_json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'JSON upload failed');
    }
    return res.json();
  },

  /**
   * Ingest candidate + assessment outputs into Phase 3 Evaluator context
   */
  async ingestPhase2(params: IngestPhase2Params) {
    const res = await fetch(`${EVALUATOR_API_BASE}/ingest_phase2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Phase 2 ingestion failed');
    }
    return res.json();
  },

  /**
   * Start a Phase 3 Interview Session with Candidate + Assessment payload
   */
  async startInterview(params: StartInterviewParams) {
    const res = await fetch(`${EVALUATOR_API_BASE}/start_interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start interview session');
    }
    return res.json();
  },

  /**
   * Submit student response to the active interview thread
   */
  async submitAnswer(params: SubmitAnswerParams) {
    const res = await fetch(`${EVALUATOR_API_BASE}/submit_answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit answer');
    }
    return res.json();
  },

  /**
   * Manually stop active interview and generate diagnostic report
   */
  async stopInterview(threadId: string) {
    const res = await fetch(`${EVALUATOR_API_BASE}/stop_interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to stop interview');
    }
    return res.json();
  },

  /**
   * Chat endpoint for real-time AI assistant
   */
  async chat(prompt: string, history: any[] = []) {
    const res = await fetch(`${EVALUATOR_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Chat request failed');
    }
    return res.json();
  },

  /**
   * Admin: Get all completed interview sessions
   */
  async getAllInterviews() {
    const res = await fetch(`${EVALUATOR_API_BASE}/admin/interviews`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch interviews history');
    }
    return res.json();
  },

  /**
   * Admin: Get detail for a specific thread_id
   */
  async getInterviewDetail(threadId: string) {
    const res = await fetch(`${EVALUATOR_API_BASE}/admin/interviews/${encodeURIComponent(threadId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch interview detail');
    }
    return res.json();
  },

  /**
   * Admin: Get LLM invocation logs
   */
  async getLogs() {
    const res = await fetch(`${EVALUATOR_API_BASE}/admin/logs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch system logs');
    }
    return res.json();
  },
};
