import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface PageCardProps {
  index: number;
  imageBase64?: string;
  caption: string;
  loading?: boolean;
  onRegenerate: () => void;
  onCaptionChange: (next: string) => void;
}

export function PageCard({
  index,
  imageBase64,
  caption,
  loading,
  onRegenerate,
  onCaptionChange,
}: PageCardProps) {
  const downloadImage = () => {
    if (!imageBase64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `comic-page-${index + 1}.png`;
    link.click();
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Page {index + 1}</h3>
        {loading && <span className="text-xs text-muted-foreground">Generating...</span>}
      </div>
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
        {loading ? (
          <div className="h-full w-full animate-pulse bg-slate-200" />
        ) : imageBase64 ? (
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt={`Comic page ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Placeholder
          </div>
        )}
      </div>

      <label className="mt-3 block text-sm font-medium">Caption</label>
      <Textarea
        aria-label={`Caption for page ${index + 1}`}
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        className="mt-1 min-h-20"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRegenerate} aria-label={`Regenerate page ${index + 1}`}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Regenerate this page
        </Button>
        <Button variant="secondary" onClick={downloadImage} disabled={!imageBase64} aria-label={`Download page ${index + 1}`}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
    </Card>
  );
}
