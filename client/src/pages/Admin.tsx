import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints.api';
import { authoritiesApi } from '../api/authorities.api';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { PageLoader } from '../components/LoadingState';
import { Shield, FileText, Building2, AlertCircle, CheckCircle, Send, Clock } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste Management', road_damage: 'Road Damage',
  street_lighting: 'Street Lighting', water_supply: 'Water Supply',
  electricity: 'Electricity', traffic: 'Traffic',
  sewerage: 'Sewerage', public_infrastructure: 'Public Infrastructure', other: 'Other',
};

export function Admin() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => complaintsApi.stats().then((r) => r.data.data),
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints', { page: 1, admin: true }],
    queryFn: () => complaintsApi.list({ limit: 20 }).then((r) => r.data.data),
  });

  const { data: authorities } = useQuery({
    queryKey: ['authorities'],
    queryFn: () => authoritiesApi.list().then((r) => r.data.data),
  });

  if (statsLoading || complaintsLoading) return <PageLoader />;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-brand-600" />
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: FileText, color: 'bg-gray-100 text-gray-600' },
          { label: 'Needs Review', value: stats?.needsReview ?? 0, icon: AlertCircle, color: 'bg-amber-100 text-amber-600' },
          { label: 'Sent', value: stats?.sent ?? 0, icon: Send, color: 'bg-green-100 text-green-600' },
          { label: 'Resolved', value: stats?.resolved ?? 0, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{s.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All complaints */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Complaints</h2>
            <Link to="/complaints" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {complaintsData?.complaints.map((c) => (
              <Link key={c.id} to={`/complaints/${c.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {c.reference} · {c.senderEmail}
                    {c.aiAnalysis && ` · ${CATEGORY_LABELS[c.aiAnalysis.category] || c.aiAnalysis.category}`}
                  </p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          {/* Categories */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">By Category</h3>
            <div className="space-y-2">
              {stats?.byCategory?.map((item: any) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 text-xs">{CATEGORY_LABELS[item.category] || item.category}</span>
                  <span className="font-semibold text-gray-900">{item._count}</span>
                </div>
              ))}
              {!stats?.byCategory?.length && <p className="text-xs text-gray-400">No data</p>}
            </div>
          </div>

          {/* Authorities */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Authorities</h3>
              <Link to="/admin/authorities" className="text-xs text-brand-600 hover:underline">Manage</Link>
            </div>
            <div className="space-y-2">
              {authorities?.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${a.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <p className="text-xs text-gray-700 truncate">{a.name}</p>
                </div>
              ))}
              {authorities && authorities.length > 5 && (
                <p className="text-xs text-gray-400">+{authorities.length - 5} more</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
