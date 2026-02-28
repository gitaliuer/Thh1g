import { NextResponse } from "next/server";
import { z } from "zod";
import { buildImagePrompt } from "@/lib/prompting";
import { getOpenAIClient, OPENAI_IMAGE_MODEL } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { generatePageInputSchema } from "@/types/comic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`generate:${ip}`);

    if (!rate.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rate.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const input = generatePageInputSchema.parse(body);

    const prompt = buildImagePrompt(
      input.plan,
      input.pageIndex,
      input.consistencyMode,
      input.overrides?.imagePrompt,
    );

    const client = getOpenAIClient();
    const image = await client.images.generate({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size: input.plan.meta.pageFormat === "1024x1536" ? "1024x1536" : "1024x1024",
    });

    const imageBase64 = image.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
    }

    return NextResponse.json({
      imageBase64,
      revisedPrompt: image.data?.[0]?.revised_prompt,
      caption: input.overrides?.caption || input.plan.pages[input.pageIndex].caption,
    });
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
