import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints.api';
import toast from 'react-hot-toast';
import { Brain, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function NewComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: '',
    body: '',
    senderEmail: user?.email || '',
    senderName: user?.name || '',
    location: '',
    city: '',
    state: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => complaintsApi.create(data).then((r) => r.data.data),
    onSuccess: async (complaint) => {
      toast.success('Complaint created, running AI analysis…');
      try {
        await complaintsApi.analyze(complaint.id);
        navigate(`/complaints/${complaint.id}`);
      } catch {
        navigate(`/complaints/${complaint.id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details and AI will classify and route your complaint</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Subject *</label>
          <input
            className="input"
            placeholder="e.g. Garbage has not been collected"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Complaint Description *</label>
          <textarea
            className="input min-h-32 resize-y"
            placeholder="Describe the issue in detail…"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
            minLength={20}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="Your full name"
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Your Email *</label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={form.senderEmail}
              onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Location / Area</label>
          <input
            className="input"
            placeholder="e.g. Sector 68, near park"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              placeholder="e.g. Mohali"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label">State</label>
            <input
              className="input"
              placeholder="e.g. Punjab"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary w-full justify-center py-2.5"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Brain className="w-4 h-4 animate-pulse" />
                Analyzing with AI…
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze Complaint
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
