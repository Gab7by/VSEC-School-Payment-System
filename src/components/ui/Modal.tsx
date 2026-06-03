import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  maxWidth?: string;
};

export default function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scale-in`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-1.5 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
