import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints.api';
import { FileText, Clock, Send, AlertCircle, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PageLoader, SkeletonCard } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ComplaintStatus } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste Management', road_damage: 'Road Damage',
  street_lighting: 'Street Lighting', water_supply: 'Water Supply',
  electricity: 'Electricity', traffic: 'Traffic',
  sewerage: 'Sewerage', public_infrastructure: 'Public Infrastructure', other: 'Other',
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => complaintsApi.stats().then((r) => r.data.data),
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints', { page: 1 }],
    queryFn: () => complaintsApi.list({ limit: 5 }).then((r) => r.data.data),
  });

  if (statsLoading) return <PageLoader />;

  const stats = statsData;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats?.total ?? 0} icon={FileText} color="bg-gray-100 text-gray-600" />
        <StatCard label="Ready to Send" value={stats?.pending ?? 0} icon={Clock} color="bg-purple-100 text-purple-600" />
        <StatCard label="Needs Review" value={stats?.needsReview ?? 0} icon={AlertCircle} color="bg-amber-100 text-amber-600" />
        <StatCard label="Sent" value={stats?.sent ?? 0} icon={Send} color="bg-green-100 text-green-600" />
        <StatCard label="In Progress" value={stats?.inProgress ?? 0} icon={ArrowRight} color="bg-orange-100 text-orange-600" />
        <StatCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent complaints table */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
            <Link to="/complaints" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {complaintsLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : !complaintsData?.complaints.length ? (
            <EmptyState
              title="No complaints yet"
              description="Simulate an incoming email to get started"
              action={<Link to="/dev/email-simulator" className="btn-primary text-sm">Try Email Simulator</Link>}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {complaintsData.complaints.map((c) => (
                <Link key={c.id} to={`/complaints/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.reference} · {c.city || 'Unknown location'}
                      {c.aiAnalysis && ` · ${CATEGORY_LABELS[c.aiAnalysis.category] || c.aiAnalysis.category}`}
                    </p>
                  </div>
                  <StatusBadge status={c.status} size="sm" />
                </Link>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-gray-100">
            <Link to="/complaints/new" className="btn-secondary w-full justify-center text-sm">
              <Plus className="w-4 h-4" /> New Complaint
            </Link>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
          {!stats?.byCategory?.length ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.byCategory.slice(0, 7).map((item: any) => (
                <div key={item.category} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${Math.min(100, (item._count / (stats.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-5 text-right">{item._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
