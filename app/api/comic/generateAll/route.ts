import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { generatePageInputSchema } from "@/types/comic";

export const runtime = "nodejs";

const inputSchema = z.object({
  plan: generatePageInputSchema.shape.plan,
  consistencyMode: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`generateAll:${ip}`);

    if (!rate.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rate.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const input = inputSchema.parse(body);

    const pages = [];
    for (let i = 0; i < 4; i++) {
      const res = await fetch(new URL("/api/comic/generate", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: input.plan,
          pageIndex: i,
          consistencyMode: input.consistencyMode,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: "Unknown error" }));
        return NextResponse.json(
          { error: `Page ${i + 1} failed`, detail: errorBody.error },
          { status: res.status },
        );
      }

      pages.push(await res.json());
    }

    return NextResponse.json({ pages });
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
