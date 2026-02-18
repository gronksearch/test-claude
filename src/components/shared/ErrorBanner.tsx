interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg max-w-sm flex items-start gap-3">
      <span className="text-red-700 dark:text-red-300 text-sm flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 dark:hover:text-red-200 shrink-0 leading-none"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}
