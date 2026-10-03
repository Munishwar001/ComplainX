import React from 'react';
import { ComplaintStatus } from '../types';

const CONFIG: Record<ComplaintStatus, { label: string; className: string }> = {
  RECEIVED: { label: 'Received', className: 'bg-gray-100 text-gray-700' },
  ANALYZING: { label: 'Analyzing', className: 'bg-blue-100 text-blue-700 animate-pulse' },
  NEEDS_REVIEW: { label: 'Needs Review', className: 'bg-amber-100 text-amber-700' },
  READY_TO_SEND: { label: 'Ready to Send', className: 'bg-purple-100 text-purple-700' },
  SENT: { label: 'Sent', className: 'bg-green-100 text-green-700' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-teal-100 text-teal-700' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

interface Props {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
