import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient, OPENAI_TEXT_MODEL } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { comicPlanSchema, createPlanInputSchema } from "@/types/comic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`plan:${ip}`);

    if (!rate.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rate.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const input = createPlanInputSchema.parse(body);

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.7,
      input: [
        {
          role: "system",
          content:
            "You are a comics creative director. Return ONLY valid JSON matching schema. Create 4-page continuous story with coherent style and character consistency.",
        },
        {
          role: "user",
          content: `Build a ComicPlan JSON for:\nPrompt: ${input.prompt}\nStyle preset: ${input.stylePreset}\nTone: ${input.tone}\nPage format: ${input.pageFormat}\nLanguage: ${input.language}\nRules:\n- 2 to 4 characters\n- pages indexes exactly 0,1,2,3\n- captions 1-2 short sentences\n- imagePrompt concise and production-ready\n- globalNegative must include: deformed faces, extra fingers, watermark, logo, text bubbles, random text`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ComicPlan",
          schema: {
            type: "object",
            properties: {
              meta: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  language: { type: "string", enum: ["ru", "en", "kz"] },
                  stylePreset: { type: "string" },
                  tone: { type: "string" },
                  pageFormat: { type: "string", enum: ["1024x1536", "1024x1024"] },
                  globalNegative: { type: "string" },
                  visualBible: {
                    type: "object",
                    properties: {
                      artStyle: { type: "string" },
                      palette: { type: "string" },
                      linework: { type: "string" },
                      shading: { type: "string" },
                      cameraRules: { type: "string" },
                      typographyRule: { type: "string" },
                    },
                    required: ["artStyle", "palette", "linework", "shading", "cameraRules", "typographyRule"],
                    additionalProperties: false,
                  },
                },
                required: ["title", "language", "stylePreset", "tone", "pageFormat", "globalNegative", "visualBible"],
                additionalProperties: false,
              },
              characters: {
                type: "array",
                minItems: 2,
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    appearance: { type: "string" },
                    outfit: { type: "string" },
                    personality: { type: "string" },
                    doNotChange: { type: "string" },
                  },
                  required: ["id", "name", "appearance", "outfit", "personality", "doNotChange"],
                  additionalProperties: false,
                },
              },
              pages: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer", enum: [0, 1, 2, 3] },
                    beat: { type: "string" },
                    setting: { type: "string" },
                    composition: { type: "string" },
                    emotion: { type: "string" },
                    keyProps: { type: "string" },
                    imagePrompt: { type: "string" },
                    caption: { type: "string" },
                  },
                  required: ["index", "beat", "setting", "composition", "emotion", "keyProps", "imagePrompt", "caption"],
                  additionalProperties: false,
                },
              },
            },
            required: ["meta", "characters", "pages"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const raw = response.output_text;
    const parsed = comicPlanSchema.parse(JSON.parse(raw));
    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
