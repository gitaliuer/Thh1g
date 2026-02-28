import { z } from "zod";

export const languageSchema = z.enum(["ru", "en", "kz"]);
export const stylePresetSchema = z.enum([
  "Manga",
  "Western comic",
  "Pixar-like",
  "Noir",
  "Kids book",
  "Cyberpunk",
]);
export const toneSchema = z.enum(["funny", "adventure", "mystery", "slice of life"]);
export const pageFormatSchema = z.enum(["1024x1536", "1024x1024"]);

const visualBibleSchema = z.object({
  artStyle: z.string().min(5),
  palette: z.string().min(3),
  linework: z.string().min(3),
  shading: z.string().min(3),
  cameraRules: z.string().min(3),
  typographyRule: z.string().min(3),
});

const characterSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(1),
  appearance: z.string().min(5),
  outfit: z.string().min(3),
  personality: z.string().min(3),
  doNotChange: z.string().min(3),
});

const pageSchema = z.object({
  index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  beat: z.string().min(5),
  setting: z.string().min(3),
  composition: z.string().min(3),
  emotion: z.string().min(3),
  keyProps: z.string().min(3),
  imagePrompt: z.string().min(8),
  caption: z.string().min(3),
});

export const comicPlanSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    language: languageSchema,
    stylePreset: z.string().min(1),
    tone: z.string().min(1),
    pageFormat: pageFormatSchema,
    globalNegative: z.string().min(3),
    visualBible: visualBibleSchema,
  }),
  characters: z.array(characterSchema).min(2).max(4),
  pages: z
    .array(pageSchema)
    .length(4)
    .refine((pages) => pages.every((p, i) => p.index === i), "Pages must be index 0..3"),
});

export const createPlanInputSchema = z.object({
  prompt: z.string().min(10).max(2000),
  stylePreset: stylePresetSchema,
  tone: toneSchema,
  pageFormat: pageFormatSchema,
  language: languageSchema.default("en"),
});

export const generatePageInputSchema = z.object({
  plan: comicPlanSchema,
  pageIndex: z.number().int().min(0).max(3),
  consistencyMode: z.boolean().default(true),
  overrides: z
    .object({
      beat: z.string().optional(),
      caption: z.string().optional(),
      imagePrompt: z.string().optional(),
    })
    .optional(),
});

export type ComicPlan = z.infer<typeof comicPlanSchema>;
export type CreatePlanInput = z.infer<typeof createPlanInputSchema>;
export type GeneratePageInput = z.infer<typeof generatePageInputSchema>;
