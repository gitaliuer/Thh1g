export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow">
      <p>{message}</p>
      <button className="mt-2 text-xs underline" onClick={onClose}>
        Dismiss
      </button>
    </div>
  );
}
