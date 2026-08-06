const DEFAULT_API_URL =
  "https://att-langgraph-orchestrator-edward-jing-dev.apps.rm1.0a51.p1.openshiftapps.com/api/v1/ask";

const apiUrl = process.env.REACT_APP_AI_API_URL?.trim() || DEFAULT_API_URL;
const billingAccountToken =
  process.env.REACT_APP_BILLING_ACCOUNT_TOKEN?.trim() || "tok_demo_sas_003";
const configuredMaxResults = Number(
  process.env.REACT_APP_MAX_RESULTS_PER_SOURCE || 3
);
const maxResultsPerSource = Number.isFinite(configuredMaxResults)
  ? configuredMaxResults
  : 3;

const decodePythonEscapes = (value) =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");

const extractAnswerText = (answer) => {
  if (Array.isArray(answer)) {
    const textItem = answer.find((item) => item?.type === "text");
    return textItem?.text?.trim() || "";
  }

  if (typeof answer !== "string") return "";

  // The current API serializes the model output as a Python-list string.
  // Extract the final text item and intentionally omit the reasoning summary.
  const textMatch = answer.match(
    /'type':\s*'text',\s*'text':\s*'((?:\\.|[^'])*)'/s
  );

  return decodePythonEscapes(textMatch?.[1] || answer).trim();
};

export const sendAiMessage = async ({ message }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: message,
        billingAccountToken,
        maxResultsPerSource,
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
      throw new Error("The AI service returned an invalid JSON response.");
    }

    if (!response.ok) {
      const apiError = data?.detail || data?.message || responseText;
      throw new Error(
        apiError || `AI service returned HTTP ${response.status}.`
      );
    }

    const content = extractAnswerText(data.answer);

    if (!content) {
      throw new Error("The AI service response does not contain an answer.");
    }

    return {
      content,
      traceId: data.traceId || null,
      intents: Array.isArray(data.intents) ? data.intents : [],
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The AI request timed out after 60 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
