import type { ComicPlan } from "@/types/comic";

type GeneratedPage = {
  imageBase64: string;
  caption: string;
  revisedPrompt?: string;
};

export const inMemoryProjects = new Map<
  string,
  {
    plan: ComicPlan;
    pages: Partial<Record<number, GeneratedPage>>;
  }
>();
