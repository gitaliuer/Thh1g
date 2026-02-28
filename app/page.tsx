"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgressStepper } from "@/components/progress-stepper";
import { PageCard } from "@/components/page-card";
import { Toast } from "@/components/toast";
import type { ComicPlan } from "@/types/comic";

const HISTORY_KEY = "comic-generator-history";
const MAX_HISTORY = 8;

type GeneratedPage = { imageBase64?: string; caption: string; loading?: boolean };

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("Manga");
  const [tone, setTone] = useState("adventure");
  const [pageFormat, setPageFormat] = useState("1024x1536");
  const [consistencyMode, setConsistencyMode] = useState(true);
  const [plan, setPlan] = useState<ComicPlan | null>(null);
  const [pages, setPages] = useState<GeneratedPage[]>(
    Array.from({ length: 4 }, () => ({ caption: "" })),
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const canGenerate = useMemo(() => prompt.trim().length >= 10 && !isGenerating, [prompt, isGenerating]);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { prompt: string; plan: ComicPlan; pages: GeneratedPage[] }[];
      if (parsed.length > 0) {
        setPrompt(parsed[0].prompt);
        setPlan(parsed[0].plan);
        setPages(parsed[0].pages);
      }
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const saveHistory = (nextPrompt: string, nextPlan: ComicPlan, nextPages: GeneratedPage[]) => {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as unknown[];
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([{ prompt: nextPrompt, plan: nextPlan, pages: nextPages }, ...prev].slice(0, MAX_HISTORY)),
    );
  };

  const generatePage = async (activePlan: ComicPlan, pageIndex: number, signal?: AbortSignal) => {
    setPages((prev) => prev.map((p, idx) => (idx === pageIndex ? { ...p, loading: true } : p)));
    setCurrentStep(pageIndex + 1);

    const res = await fetch("/api/comic/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: activePlan,
        pageIndex,
        consistencyMode,
        overrides: { caption: pages[pageIndex]?.caption || activePlan.pages[pageIndex].caption },
      }),
      signal,
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error || `Failed on page ${pageIndex + 1}`);

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === pageIndex
          ? { imageBase64: payload.imageBase64, caption: payload.caption, loading: false }
          : { ...page, loading: false },
      ),
    );

    return payload;
  };

  const handleGenerateAll = async () => {
    setToastMessage("");
    setIsGenerating(true);
    abortRef.current = new AbortController();

    try {
      setCurrentStep(0);
      const planResponse = await fetch("/api/comic/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, stylePreset, tone, pageFormat, language: "ru" }),
        signal: abortRef.current.signal,
      });

      const planPayload = await planResponse.json();
      if (!planResponse.ok) throw new Error(planPayload?.error || "Plan generation failed");

      const nextPlan = planPayload as ComicPlan;
      setPlan(nextPlan);
      setPages(nextPlan.pages.map((p) => ({ caption: p.caption })));

      const generatedPages: GeneratedPage[] = nextPlan.pages.map((p) => ({ caption: p.caption }));
      for (let i = 0; i < 4; i++) {
        const payload = await generatePage(nextPlan, i, abortRef.current.signal);
        generatedPages[i] = { caption: payload.caption, imageBase64: payload.imageBase64 };
      }

      setCurrentStep(4);
      saveHistory(prompt, nextPlan, generatedPages);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const regeneratePage = async (idx: number) => {
    if (!plan) return;
    try {
      await generatePage(plan, idx);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Failed to regenerate page");
    }
  };

  const startNew = () => {
    abortRef.current?.abort();
    setPlan(null);
    setPrompt("");
    setCurrentStep(-1);
    setPages(Array.from({ length: 4 }, () => ({ caption: "" })));
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 sm:p-8">
      <h1 className="mb-2 text-3xl font-bold">4-Page Comic Generator</h1>
      <p className="mb-6 text-sm text-muted-foreground">One prompt in, one coherent 4-page comic out.</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <label htmlFor="prompt" className="mb-2 block text-sm font-medium">
            Prompt
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A shy inventor and a street cat accidentally open a portal in Almaty..."
            aria-label="Comic prompt"
            className="min-h-40"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Style preset</label>
              <Select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)} aria-label="Style preset">
                {[
                  "Manga",
                  "Western comic",
                  "Pixar-like",
                  "Noir",
                  "Kids book",
                  "Cyberpunk",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Page format</label>
              <Select value={pageFormat} onChange={(e) => setPageFormat(e.target.value)} aria-label="Page format">
                <option value="1024x1536">portrait 1024x1536</option>
                <option value="1024x1024">square 1024x1024</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Tone</label>
              <Select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone">
                {["funny", "adventure", "mystery", "slice of life"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input
                type="checkbox"
                checked={consistencyMode}
                onChange={(e) => setConsistencyMode(e.target.checked)}
                aria-label="Consistency mode"
              />
              Consistency mode
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleGenerateAll} disabled={!canGenerate}>
              Generate 4 pages
            </Button>
            <Button variant="secondary" onClick={() => abortRef.current?.abort()} disabled={!isGenerating}>
              Cancel
            </Button>
            <Button variant="outline" onClick={startNew}>
              Start new
            </Button>
          </div>

          <div className="mt-4">
            <ProgressStepper currentStep={currentStep} />
          </div>

          {plan && (
            <div className="mt-3">
              <Button variant="outline" onClick={handleGenerateAll} disabled={isGenerating}>
                Regenerate all
              </Button>
            </div>
          )}
        </Card>

        <section className="grid gap-4 sm:grid-cols-2">
          {pages.map((page, idx) => (
            <PageCard
              key={idx}
              index={idx}
              imageBase64={page.imageBase64}
              caption={page.caption}
              loading={page.loading}
              onRegenerate={() => regeneratePage(idx)}
              onCaptionChange={(next) =>
                setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, caption: next } : p)))
              }
            />
          ))}
        </section>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </main>
  );
}
