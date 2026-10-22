export function evaluateAnswer(answer, expectedConcepts = []) {
  const text = String(answer ?? "").trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  const matched = expectedConcepts.filter((concept) => {
    const normalized = String(concept).toLowerCase();
    return normalized && text.includes(normalized);
  });

  // Do not award points just for typing random text. A response must match
  // at least one expected concept before it can receive a meaningful score.
  if (!text || matched.length === 0) {
    return {
      score: 0,
      matched,
      strong: false
    };
  }

  // 80% of the score comes from covering the expected concepts.
  const conceptScore = Math.round(
    (matched.length / Math.max(expectedConcepts.length, 1)) * 80
  );

  // Up to 20% rewards an answer with enough explanation, without allowing
  // length alone to make an incorrect answer look good.
  const lengthScore = Math.min(20, Math.round((words.length / 40) * 20));

  const score = Math.min(100, conceptScore + lengthScore);

  return {
    score,
    matched,
    strong: score >= 70
  };
}

export function evaluateInterview(answers) {
  const results = answers.map((entry) => ({
    ...entry,
    evaluation: entry.aiEvaluation || evaluateAnswer(entry.answer, entry.concepts)
  }));
  const score = Math.round(results.reduce((sum, item) => sum + item.evaluation.score, 0) / Math.max(results.length, 1));
  const strong = results.filter((item) => item.evaluation.strong);
  const weak = results.filter((item) => !item.evaluation.strong);
  const strengths = [...new Set(strong.flatMap((item) => item.concepts).filter((concept) =>
    strong.some((item) => item.evaluation.matched.includes(concept))
  ))].slice(0, 4);
  const weaknesses = [...new Set(weak.flatMap((item) => item.concepts))].slice(0, 4);

  return {
    score,
    answered: results.length,
    strongCount: strong.length,
    weakCount: weak.length,
    strengths: strengths.length ? strengths : ["Clear effort and structured responses"],
    weaknesses: weaknesses.length ? weaknesses : ["Add more concrete examples and key concepts"],
    results
  };
}
