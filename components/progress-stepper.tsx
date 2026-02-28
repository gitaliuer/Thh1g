const steps = ["Plan", "Page 1", "Page 2", "Page 3", "Page 4"];

export function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Generation progress">
      {steps.map((step, idx) => (
        <li
          key={step}
          className={`rounded-md border px-2 py-2 text-center text-xs sm:text-sm ${
            idx <= currentStep ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}
