/**
 * Phase 1 UI course catalog. Set searchEnabled=true only when
 * att-langgraph-orchestrator supports that subject in production.
 * Phase 2 can replace this list with the authenticated course catalog API.
 */
export const learningCourses = [
  { id: "mathematics", label: "Mathematics", searchEnabled: true },
  { id: "english", label: "English", searchEnabled: false },
  { id: "physics", label: "Physics", searchEnabled: false },
  { id: "chemistry", label: "Chemistry", searchEnabled: false },
];

export const learningModes = [
  { id: "resources", label: "Find learning resources" },
  { id: "explain", label: "Explain a concept (preview)" },
  { id: "hint", label: "Give me a hint (preview)" },
];

export const suggestedQuestions = {
  mathematics: [
    "Why does 4 × 3 equal 12?",
    "Find examples of equal groups",
    "Find a lesson about rectangle area",
  ],
};
