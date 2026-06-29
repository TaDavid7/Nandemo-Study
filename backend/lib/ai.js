async function generateFlashcardsFromTextWithAI(rawText) {
  const MAX_CHARS = 2000;
  let text = (rawText || "").trim();
  if (!text) throw new Error("No text provided to AI");
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  const systemPrompt = `
You are a study assistant that turns class notes into clear Q&A flashcards.

Rules:
- Focus on key concepts, definitions, formulas, and important facts.
- Questions must be short and specific.
- Answers must be concise but correct.
- Avoid duplicates and trivial facts.
- Aim for 10–25 cards if the notes are long enough.
- Respond with JSON ONLY in this exact format:

{
  "cards": [
    { "question": "Question 1?", "answer": "Answer 1." },
    { "question": "Question 2?", "answer": "Answer 2." }
  ]
}
`.trim();

  const userPrompt = `Here are the notes:\n\n"""${text}"""\n\nTurn these notes into high-quality flashcards.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("AI error:", errorText);
    throw new Error("AI request failed");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";

  let jsonText = content.trim();
  const fenced = jsonText.match(/```json([\s\S]*?)```/i);
  if (fenced) {
    jsonText = fenced[1].trim();
  } else {
    const braceMatch = jsonText.match(/\{[\s\S]*\}/);
    if (braceMatch) jsonText = braceMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse AI JSON:", content);
    const relaxed = jsonText
      .replace(/""([^"]*?)""/g, "'$1'")
      .replace(/,\s*([}\]])/g, "$1");
    try {
      parsed = JSON.parse(relaxed);
    } catch (e2) {
      console.error("Relaxed JSON parse also failed:", relaxed);
      throw new Error("AI output was not valid JSON");
    }
  }

  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  return cards
    .filter(
      (c) =>
        c &&
        typeof c.question === "string" &&
        typeof c.answer === "string" &&
        c.question.trim() &&
        c.answer.trim()
    )
    .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }));
}

module.exports = { generateFlashcardsFromTextWithAI };
