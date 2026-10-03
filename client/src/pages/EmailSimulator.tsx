import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { devApi } from '../api/complaints.api';
import toast from 'react-hot-toast';
import { Mail, Send, Zap, Terminal } from 'lucide-react';

const DEMO_EXAMPLES = [
  {
    label: 'Garbage',
    senderEmail: 'citizen@example.com',
    senderName: 'Concerned Citizen',
    subject: 'Garbage has not been collected',
    body: 'There is a huge amount of garbage near Sector 68, Mohali. Nobody has collected it for the last 5 days. This is creating a serious hygiene problem near the residential area. Please take action immediately.',
  },
  {
    label: 'Pothole',
    senderEmail: 'resident@example.com',
    senderName: 'Local Resident',
    subject: 'Large pothole on main road causing accidents',
    body: 'There is a very large pothole near the main road in Sector 70, Mohali. Several vehicles have been damaged. The road near the market entrance has a deep hole approximately 2 feet wide.',
  },
  {
    label: 'Street Light',
    senderEmail: 'parkvisitor@example.com',
    senderName: 'Park Visitor',
    subject: 'Street lights not working near community park',
    body: 'The street lights near the community park in Sector 65, Mohali have not been working for the past week. The area is completely dark at night creating safety concerns for residents.',
  },
  {
    label: 'Water Leak',
    senderEmail: 'shop@example.com',
    senderName: 'Shopkeeper',
    subject: 'Water pipeline leakage near market',
    body: 'There is a water pipeline leakage near the main market in Phase 7, Mohali. Water is flowing on the road continuously for 3 days. This is causing water wastage and making the road slippery.',
  },
  {
    label: 'Power Outage',
    senderEmail: 'user@example.com',
    senderName: 'Area Resident',
    subject: 'Repeated electricity outages in the area',
    body: 'We are experiencing repeated and prolonged power outages in Sector 71, Mohali. The electricity goes off for 4-5 hours daily without any prior notice. This is affecting businesses and daily life.',
  },
];

export function EmailSimulator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    senderEmail: 'citizen@example.com',
    senderName: 'Concerned Citizen',
    subject: 'Garbage has not been collected',
    body: 'There is a huge amount of garbage near Sector 68, Mohali. Nobody has collected it for the last 5 days. This is creating a serious hygiene problem near the residential area. Please take action immediately.',
  });

  const simulateMutation = useMutation({
    mutationFn: () => devApi.simulateEmail(form),
    onSuccess: (res) => {
      const data = res.data.data;
      toast.success(`Complaint created: ${data.reference}`);
      navigate(`/complaints/${data.complaintId}`);
    },
    onError: () => {
      toast.error('Simulation failed. Is the server running?');
    },
  });

  const loadExample = (example: typeof DEMO_EXAMPLES[0]) => {
    setForm({
      senderEmail: example.senderEmail,
      senderName: example.senderName,
      subject: example.subject,
      body: example.body,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Email Simulator</h1>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">DEV</span>
        </div>
        <p className="text-sm text-gray-500">
          Simulate an incoming complaint email to test the full AI analysis and authority routing pipeline.
        </p>
      </div>

      {/* Quick examples */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email compose form */}
      <div className="card overflow-hidden">
        {/* Email header bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Incoming Email — complaints@complanx.app</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">From (Email) *</label>
              <input
                type="email"
                className="input"
                placeholder="citizen@example.com"
                value={form.senderEmail}
                onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Sender Name</label>
              <input
                className="input"
                placeholder="Sender name (optional)"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Subject *</label>
            <input
              className="input"
              placeholder="Brief description of the issue"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Email Body *</label>
            <textarea
              className="input min-h-40 resize-y"
              placeholder="Detailed description of the complaint…"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            This will create a complaint, run AI analysis, and route to the appropriate authority
          </p>
          <button
            className="btn-primary"
            onClick={() => simulateMutation.mutate()}
            disabled={simulateMutation.isPending || !form.senderEmail || !form.subject || !form.body}
          >
            {simulateMutation.isPending ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" />
                Processing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Simulate Incoming Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* What happens next */}
      <div className="card p-5 bg-brand-50 border-brand-100">
        <h3 className="text-sm font-semibold text-brand-900 mb-3">What happens when you click Simulate</h3>
        <ol className="space-y-1.5">
          {[
            'Complaint record is created with a unique reference',
            'AI analyzes the subject and body to classify the issue',
            'The appropriate authority/department is identified from the database',
            'A professional complaint email is generated',
            'You are redirected to the complaint page to review and approve',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-brand-800">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
