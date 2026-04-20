import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={cn(
        "relative z-50 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 mx-4",
        className
      )}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
          <h2 className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
