import React from 'react';
import { Check, Circle } from 'lucide-react';
import { StatusHistory, ComplaintStatus } from '../types';

const TIMELINE_STEPS: { status: ComplaintStatus; label: string }[] = [
  { status: 'RECEIVED', label: 'Complaint Received' },
  { status: 'ANALYZING', label: 'AI Analysis Completed' },
  { status: 'READY_TO_SEND', label: 'Authority Identified & Email Generated' },
  { status: 'SENT', label: 'Email Sent to Authority' },
  { status: 'ACKNOWLEDGED', label: 'Authority Response' },
  { status: 'RESOLVED', label: 'Resolution' },
];

const STATUS_ORDER: Record<ComplaintStatus, number> = {
  RECEIVED: 0, ANALYZING: 1, NEEDS_REVIEW: 1, READY_TO_SEND: 2,
  SENT: 3, ACKNOWLEDGED: 4, IN_PROGRESS: 4, RESOLVED: 5, FAILED: -1,
};

interface Props {
  statusHistory: StatusHistory[];
  currentStatus: ComplaintStatus;
}

export function ComplaintTimeline({ statusHistory, currentStatus }: Props) {
  const currentOrder = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const stepOrder = STATUS_ORDER[step.status];
        const isDone = currentOrder >= stepOrder;
        const isCurrent = currentOrder === stepOrder;
        const historyEntry = statusHistory.find(
          (h) => STATUS_ORDER[h.status] === stepOrder && h.status !== 'ANALYZING'
        );
        const isLast = i === TIMELINE_STEPS.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  isDone
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : isCurrent
                    ? 'bg-white border-brand-400 text-brand-400'
                    : 'bg-white border-gray-300 text-gray-300'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-brand-200' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {historyEntry && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(historyEntry.createdAt).toLocaleString()}
                  {historyEntry.note && ` — ${historyEntry.note}`}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {currentStatus === 'NEEDS_REVIEW' && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">Needs Human Review</p>
          <p className="text-xs text-amber-600 mt-0.5">
            AI confidence was below threshold or no matching authority found.
          </p>
        </div>
      )}
      {currentStatus === 'FAILED' && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 font-medium">Processing Failed</p>
        </div>
      )}
    </div>
  );
}
