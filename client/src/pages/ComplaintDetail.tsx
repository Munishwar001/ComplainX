import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints.api';
import { StatusBadge } from '../components/StatusBadge';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { PageLoader } from '../components/LoadingState';
import {
  Mail, Building2, Send, RefreshCw, AlertCircle, Edit2, Check, X, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmailMessage } from '../types';

function EmailPreview({
  email,
  onEdit,
}: {
  email: EmailMessage;
  onEdit: (subject: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);

  const handleSave = () => {
    onEdit(subject, body);
    setEditing(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">Generated Email</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            email.status === 'SENT' ? 'bg-green-100 text-green-700' :
            email.status === 'FAILED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {email.status}
          </span>
        </div>
        {email.status === 'PENDING' && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary py-1 text-xs">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary py-1 text-xs">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary py-1 text-xs">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">To</p>
          <p className="text-sm text-gray-900">{email.toName ? `${email.toName} <${email.toEmail}>` : email.toEmail}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Subject</p>
          {editing ? (
            <input className="input text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{subject}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Body</p>
          {editing ? (
            <textarea
              className="input text-sm min-h-48 resize-y font-mono text-xs"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 overflow-auto max-h-64">
              {body}
            </pre>
          )}
        </div>
        {email.sentAt && (
          <p className="text-xs text-gray-400">Sent at {new Date(email.sentAt).toLocaleString()} via {email.provider}</p>
        )}
      </div>
    </div>
  );
}

export function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [emailOverrides, setEmailOverrides] = useState<{ emailSubject?: string; emailBody?: string }>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.get(id!).then((r) => r.data.data),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === 'ANALYZING' || status === 'RECEIVED' ? 2000 : false;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => complaintsApi.analyze(id!),
    onSuccess: () => {
      toast.success('Analysis started');
      qc.invalidateQueries({ queryKey: ['complaint', id] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => complaintsApi.send(id!, emailOverrides),
    onSuccess: () => {
      toast.success('Complaint sent successfully!');
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setShowConfirm(false);
    },
  });

  if (isLoading) return <PageLoader />;
  if (!complaint) return <div className="text-gray-500">Complaint not found</div>;

  const email = complaint.emailMessages[0];
  const canSend = ['READY_TO_SEND', 'NEEDS_REVIEW'].includes(complaint.status) && email;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/complaints')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to complaints
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900">{complaint.subject}</h1>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{complaint.reference} · {new Date(complaint.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {complaint.status === 'FAILED' && (
            <button className="btn-secondary text-sm" onClick={() => analyzeMutation.mutate()}>
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
          {complaint.status === 'RECEIVED' && (
            <button className="btn-secondary text-sm" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              <RefreshCw className="w-4 h-4" /> {analyzeMutation.isPending ? 'Analyzing…' : 'Analyze'}
            </button>
          )}
          {canSend && (
            <button className="btn-primary text-sm" onClick={() => setShowConfirm(true)}>
              <Send className="w-4 h-4" /> Approve & Send
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Send this complaint?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will send the email to{' '}
              <strong>{complaint.authority?.name} — {complaint.authority?.department}</strong>
              {' '}at <strong>{email?.toEmail}</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => sendMutation.mutate()}
                className="btn-primary flex-1 justify-center"
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? 'Sending…' : 'Send Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original complaint */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Original Complaint</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-gray-900">{complaint.senderName ? `${complaint.senderName} <${complaint.senderEmail}>` : complaint.senderEmail}</p>
                </div>
                {(complaint.city || complaint.location) && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-gray-900">{[complaint.location, complaint.city, complaint.state].filter(Boolean).join(', ')}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Message</p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {complaint.body}
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {complaint.status === 'ANALYZING' && (
            <div className="card p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-900">AI is analyzing your complaint…</p>
                <p className="text-xs text-gray-500">This usually takes a few seconds</p>
              </div>
            </div>
          )}

          {complaint.aiAnalysis && <AIAnalysisCard analysis={complaint.aiAnalysis} />}

          {/* Authority */}
          {complaint.authority && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Identified Authority</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Organization</p>
                  <p className="font-medium text-gray-900">{complaint.authority.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">{complaint.authority.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-900">{complaint.authority.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-gray-900">{complaint.authority.city}, {complaint.authority.state}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Email */}
          {email && (
            <EmailPreview
              email={{ ...email, subject: emailOverrides.emailSubject || email.subject, body: emailOverrides.emailBody || email.body }}
              onEdit={(emailSubject, emailBody) => setEmailOverrides({ emailSubject, emailBody })}
            />
          )}

          {/* Needs review warning */}
          {complaint.status === 'NEEDS_REVIEW' && !complaint.authority && (
            <div className="card p-5 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Needs Human Review</p>
                  <p className="text-sm text-amber-700 mt-1">
                    The AI could not find a matching authority or confidence was below threshold.
                    Please review and manually assign an authority.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-5">Timeline</h3>
            <ComplaintTimeline statusHistory={complaint.statusHistory} currentStatus={complaint.status} />
          </div>

          {complaint.aiAnalysis && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium">{Math.round(complaint.aiAnalysis.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Severity</span>
                  <span className="font-medium capitalize">{complaint.aiAnalysis.severity.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Urgency</span>
                  <span className="font-medium capitalize">{complaint.aiAnalysis.urgency.toLowerCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
