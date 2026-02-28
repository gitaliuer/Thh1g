import type { ComicPlan } from "@/types/comic";

export function buildImagePrompt(
  plan: ComicPlan,
  pageIndex: number,
  consistencyMode: boolean,
  overridePrompt?: string,
) {
  const page = plan.pages[pageIndex];
  const basePrompt = overridePrompt || page.imagePrompt;

  if (!consistencyMode) {
    return `${basePrompt}\nNegative prompt: ${plan.meta.globalNegative}`;
  }

  const invariants = plan.characters
    .map((char) => `${char.name} (${char.id}): ${char.doNotChange}`)
    .join("; ");

  const characterBible = plan.characters
    .map(
      (char) =>
        `${char.name} [${char.id}] appearance: ${char.appearance}. Outfit: ${char.outfit}. Personality: ${char.personality}.`,
    )
    .join(" ");

  const v = plan.meta.visualBible;

  return [
    `Comic page ${pageIndex + 1} of 4.`,
    `Story beat: ${page.beat}`,
    `Setting: ${page.setting}. Composition: ${page.composition}. Emotion: ${page.emotion}. Key props: ${page.keyProps}.`,
    `Art direction: ${v.artStyle}; palette ${v.palette}; linework ${v.linework}; shading ${v.shading}; camera rules ${v.cameraRules}; typography rule: ${v.typographyRule}.`,
    `Character bible: ${characterBible}`,
    "Same character designs across all pages.",
    `Character invariants: ${invariants}`,
    `Base scene prompt: ${basePrompt}`,
    `Negative prompt: ${plan.meta.globalNegative}`,
  ].join("\n");
}
