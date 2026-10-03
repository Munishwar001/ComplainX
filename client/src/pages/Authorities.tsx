import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authoritiesApi } from '../api/authorities.api';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { PageLoader } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste', road_damage: 'Roads',
  street_lighting: 'Lighting', water_supply: 'Water',
  electricity: 'Electricity', traffic: 'Traffic',
  sewerage: 'Sewerage', public_infrastructure: 'Infrastructure', other: 'Other',
};

export function Authorities() {
  const { data, isLoading } = useQuery({
    queryKey: ['authorities'],
    queryFn: () => authoritiesApi.list().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Authorities</h1>
        <p className="text-sm text-gray-500">{data?.length ?? 0} registered authorities</p>
      </div>

      {!data?.length ? (
        <EmptyState title="No authorities configured" description="Authorities are seeded in the database" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((authority) => (
            <div key={authority.id} className={`card p-5 ${!authority.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{authority.name}</p>
                    <p className="text-xs text-gray-500">{authority.department}</p>
                  </div>
                </div>
                {!authority.isActive && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactive</span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {authority.city}, {authority.state}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {authority.email}
                </div>
                {authority.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {authority.phone}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {authority.categories.map((cat) => (
                  <span key={cat} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
