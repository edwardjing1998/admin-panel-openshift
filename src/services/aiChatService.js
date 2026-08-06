import faqGroups from "../data/faqData.json";

const apiUrl = process.env.REACT_APP_AI_API_URL?.trim();

const allQuestions = faqGroups.flatMap((group) => group.questions);

const findMockAnswer = (message) => {
  const words = message
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);

  const match = allQuestions.find(({ question }) => {
    const normalizedQuestion = question.toLowerCase();
    return words.some((word) => normalizedQuestion.includes(word));
  });

  return (
    match?.answer ||
    "This demo currently answers questions from the FAQ. Try asking about the minimum investment, available products, portfolio management, fund access, or investment duration."
  );
};

export const sendAiMessage = async ({ message, history }) => {
  if (!apiUrl) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return findMockAnswer(message);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error(`AI service returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  const answer = data.answer || data.message;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("AI service response does not contain an answer.");
  }

  return answer.trim();
};
