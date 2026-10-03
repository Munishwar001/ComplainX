import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authoritiesApi } from '../api/authorities.api';
import { Authority } from '../types';
import { PageLoader } from '../components/LoadingState';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_CATEGORIES = [
  'waste_management', 'road_damage', 'street_lighting', 'water_supply',
  'electricity', 'traffic', 'sewerage', 'public_infrastructure', 'other',
];

const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste Management', road_damage: 'Road Damage',
  street_lighting: 'Street Lighting', water_supply: 'Water Supply',
  electricity: 'Electricity', traffic: 'Traffic',
  sewerage: 'Sewerage', public_infrastructure: 'Public Infrastructure', other: 'Other',
};

function AuthorityForm({ initial, onSave, onCancel }: {
  initial?: Partial<Authority>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    department: initial?.department || '',
    city: initial?.city || '',
    state: initial?.state || '',
    country: initial?.country || 'India',
    email: initial?.email || '',
    phone: initial?.phone || '',
    categories: initial?.categories || [],
    isActive: initial?.isActive ?? true,
  });

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  return (
    <div className="card p-5 border-brand-200 bg-brand-50/30 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Organization Name *</label>
          <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div>
          <label className="label">Department *</label>
          <input className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
        </div>
        <div>
          <label className="label">City *</label>
          <input className="input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
        </div>
        <div>
          <label className="label">State *</label>
          <input className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="label">Handles Categories *</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                form.categories.includes(cat)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.name || !form.email || !form.categories.length}>
          <Check className="w-4 h-4" /> Save
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminAuthorities() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Authority | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['authorities'],
    queryFn: () => authoritiesApi.list().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => authoritiesApi.create(d),
    onSuccess: () => { toast.success('Authority created'); qc.invalidateQueries({ queryKey: ['authorities'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => authoritiesApi.update(id, data),
    onSuccess: () => { toast.success('Authority updated'); qc.invalidateQueries({ queryKey: ['authorities'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authoritiesApi.delete(id),
    onSuccess: () => { toast.success('Authority deleted'); qc.invalidateQueries({ queryKey: ['authorities'] }); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Manage Authorities</h1>
          <p className="text-sm text-gray-500">{data?.length ?? 0} authorities configured</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Authority
        </button>
      </div>

      {showForm && (
        <AuthorityForm
          onSave={(d) => createMutation.mutate(d)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-3">
        {data?.map((authority) => {
          const authorityId = (authority as any)._id?.toString() || authority.id;
          return (
          <div key={authorityId}>
            {editing?.id === authorityId ? (
              <AuthorityForm
                initial={authority}
                onSave={(d) => updateMutation.mutate({ id: authorityId, data: d })}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{authority.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${authority.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {authority.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{authority.department} · {authority.city}, {authority.state}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{authority.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {authority.categories.map(cat => (
                      <span key={cat} className="text-xs px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="btn-secondary py-1 text-xs" onClick={() => setEditing({ ...authority, id: authorityId })}>
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    className="btn-danger py-1 text-xs"
                    onClick={() => {
                      if (confirm(`Delete ${authority.name}?`)) deleteMutation.mutate(authorityId);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
