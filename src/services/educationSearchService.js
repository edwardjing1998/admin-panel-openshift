const DEFAULT_EDUCATION_URL =
  "https://att-langgraph-orchestrator-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com/api/v1/education/search";

const endpoint =
  process.env.REACT_APP_EDUCATION_API_URL?.trim() || DEFAULT_EDUCATION_URL;

export async function searchEducation({ message, subject, searchIntent = "auto", topK = 10 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: message,
        subject,
        search_intent: searchIntent,
        top_k: topK,
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      throw new Error("Education search returned invalid JSON.");
    }
    if (!response.ok) {
      const detail = data?.detail || data?.message;
      throw new Error(typeof detail === "string" ? detail : `Education search failed (HTTP ${response.status}).`);
    }
    const results = Array.isArray(data.results) ? data.results : [];
    const count = results.length;
    return {
      content: count
        ? `Found ${count} relevant educational ${count === 1 ? "resource" : "resources"}.`
        : "No verified educational resources matched this question. Try a more specific question or a different search intent.",
      results,
      candidateCount: Number(data.candidate_count) || 0,
      rejectedCount: Number(data.rejected_count) || 0,
      traceId: null,
      intents: [],
      evidence: [],
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Education search timed out after 90 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
