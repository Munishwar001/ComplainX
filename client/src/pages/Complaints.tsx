import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints.api';
import { StatusBadge } from '../components/StatusBadge';
import { PageLoader } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ComplaintStatus } from '../types';
import { Plus, Search, Filter } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste Management', road_damage: 'Road Damage',
  street_lighting: 'Street Lighting', water_supply: 'Water Supply',
  electricity: 'Electricity', traffic: 'Traffic',
  sewerage: 'Sewerage', public_infrastructure: 'Public Infrastructure', other: 'Other',
};

const STATUSES: ComplaintStatus[] = [
  'RECEIVED', 'ANALYZING', 'NEEDS_REVIEW', 'READY_TO_SEND',
  'SENT', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FAILED',
];

export function Complaints() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', { page, status }],
    queryFn: () => complaintsApi.list({ page, limit: 15, status: status || undefined }).then((r) => r.data.data),
  });

  const filtered = search
    ? data?.complaints.filter((c) =>
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        c.reference.toLowerCase().includes(search.toLowerCase()) ||
        c.senderEmail.toLowerCase().includes(search.toLowerCase())
      )
    : data?.complaints;

  return (
    <div className="max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Complaints</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total</p>
        </div>
        <Link to="/complaints/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-3 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search complaints…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : !filtered?.length ? (
          <EmptyState
            title="No complaints found"
            description="Try adjusting your filters or create a new complaint"
            action={<Link to="/complaints/new" className="btn-primary text-sm">New Complaint</Link>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Reference</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Subject</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 hidden lg:table-cell">Location</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/complaints/${c.id}`} className="text-brand-600 font-medium hover:underline text-xs">
                      {c.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/complaints/${c.id}`} className="text-gray-900 hover:text-brand-600 font-medium max-w-xs truncate block">
                      {c.subject}
                    </Link>
                    <p className="text-xs text-gray-400">{c.senderEmail}</p>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {c.aiAnalysis ? (
                      <span className="text-xs text-gray-600">
                        {CATEGORY_LABELS[c.aiAnalysis.category] || c.aiAnalysis.category}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-600">
                      {[c.aiAnalysis?.locationCity || c.city, c.state].filter(Boolean).join(', ') || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {data.pages}</p>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-secondary py-1 text-xs" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
