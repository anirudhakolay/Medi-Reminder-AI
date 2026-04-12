import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/ai/coach", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };

    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a caring, knowledgeable medication adherence coach. Always respond in valid JSON format as instructed. Be warm, encouraging, and specific. Never give advice about changing medication types or dosages — focus only on adherence habits and timing.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI coach error");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
