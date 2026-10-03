import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { settingsApi, AppSettingsData } from '../api/settings.api';
import toast from 'react-hot-toast';
import {
  User, Brain, Mail, CheckCircle, XCircle,
  Eye, EyeOff, RefreshCw, Wifi, WifiOff, Clock, Inbox,
  Send, Zap, ZapOff, AlertTriangle,
} from 'lucide-react';
import { PageLoader } from '../components/LoadingState';

// ── Small sub-components ───────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-gray-500" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ── Gmail Setup Section ────────────────────────────────────────────────────────

function GmailSection({ settings }: { settings: AppSettingsData }) {
  const qc = useQueryClient();

  const [gmailUser, setGmailUser]       = useState(settings.gmailUser || '');
  const [appPass, setAppPass]           = useState('');
  const [showPass, setShowPass]         = useState(false);
  // changingPassword: true when user explicitly wants to enter a new password
  const [changingPassword, setChangingPassword] = useState(!settings.gmailAppPasswordSet);
  const [enabled, setEnabled]           = useState(settings.gmailEnabled);
  const [pollInterval, setPollInterval] = useState(Math.round(settings.gmailPollInterval / 1000));
  const [testResult, setTestResult]     = useState<{ connected: boolean; message: string; inbox?: any } | null>(null);
  const [testing, setTesting]           = useState(false);

  // Keep local state in sync if settings reload
  useEffect(() => {
    setGmailUser(settings.gmailUser || '');
    setEnabled(settings.gmailEnabled);
    setPollInterval(Math.round(settings.gmailPollInterval / 1000));
    // If password becomes set remotely, close the change-password form
    if (settings.gmailAppPasswordSet) setChangingPassword(false);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) => settingsApi.update(payload),
    onSuccess: () => {
      toast.success('Gmail settings saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['imapStats'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleTestConnection = async () => {
    if (!gmailUser) {
      toast.error('Enter Gmail address first');
      return;
    }
    // Need a password — either a newly entered one or we test via server using saved one
    if (changingPassword && !appPass) {
      toast.error('Enter the App Password first');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // If user is changing password, test with the new value they typed
      // If not, send empty password — server will use the one already in DB
      const res = await settingsApi.testGmail(gmailUser, changingPassword ? appPass : '__use_saved__');
      setTestResult(res.data.data);
      if (res.data.data.connected) {
        toast.success('Connection successful!');
      } else {
        toast.error(res.data.data.message);
      }
    } catch {
      setTestResult({ connected: false, message: 'Test failed — check server logs' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const payload: any = {
      gmailEnabled: enabled,
      gmailUser,
      gmailPollInterval: pollInterval * 1000,
    };
    if (appPass) payload.gmailAppPassword = appPass;
    saveMutation.mutate(payload);
  };

  return (
    <SectionCard icon={Mail} title="Gmail Inbox Fetching">
      {/* Status banner */}
      <div className={`flex items-center gap-3 p-3 rounded-lg mb-5 ${enabled && settings.gmailUser ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
        {enabled && settings.gmailUser
          ? <><Wifi className="w-4 h-4 text-green-600 flex-shrink-0" /><div><p className="text-sm font-medium text-green-900">Polling active</p><p className="text-xs text-green-700">Fetching from {settings.gmailUser} every {pollInterval}s</p></div></>
          : <><WifiOff className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-sm font-medium text-gray-700">Not configured</p><p className="text-xs text-gray-500">Enter Gmail credentials below to start fetching complaints</p></div></>
        }
        <div className="ml-auto">
          <StatusPill ok={enabled && !!settings.gmailUser} label={enabled && settings.gmailUser ? 'Active' : 'Inactive'} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Gmail address */}
        <div>
          <label className="label">Gmail Address</label>
          <input
            type="email"
            className="input"
            placeholder="complaints@gmail.com"
            value={gmailUser}
            onChange={(e) => setGmailUser(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">The Gmail account that receives complaint emails</p>
        </div>

        {/* App Password */}
        <div>
          <label className="label">Gmail App Password</label>

          {/* Already saved — show saved state with change option */}
          {settings.gmailAppPasswordSet && !changingPassword ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">App Password saved</span>
                <span className="text-xs text-green-600">— stored securely in database</span>
              </div>
              <button
                type="button"
                onClick={() => { setChangingPassword(true); setAppPass(''); setShowPass(false); }}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            /* New password entry */
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={appPass}
                  onChange={(e) => setAppPass(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Show entered value clearly when visible */}
              {showPass && appPass && (
                <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded border">
                  {appPass}
                </p>
              )}
              {settings.gmailAppPasswordSet && (
                <button
                  type="button"
                  onClick={() => { setChangingPassword(false); setAppPass(''); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ← Keep existing password
                </button>
              )}
            </div>
          )}

          <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs font-medium text-amber-800 mb-1">How to get a Gmail App Password:</p>
            <ol className="text-xs text-amber-700 space-y-0.5 list-decimal list-inside">
              <li>Go to <strong>myaccount.google.com</strong></li>
              <li>Security → 2-Step Verification → enable it</li>
              <li>Search "App passwords" → select Mail → generate</li>
              <li>Copy the 16-character password and paste above</li>
            </ol>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-800 underline mt-1 inline-block"
            >
              Open App Passwords ↗
            </a>
          </div>
        </div>

        {/* Poll interval */}
        <div>
          <label className="label">Poll Interval: <strong>{pollInterval}s</strong></label>
          <input
            type="range"
            min={10} max={300} step={10}
            value={pollInterval}
            onChange={(e) => setPollInterval(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>10s (fast)</span><span>5 min (slow)</span>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Gmail Fetching</p>
            <p className="text-xs text-gray-500">Automatically create complaints from incoming emails</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${testResult.connected ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {testResult.connected
                ? <CheckCircle className="w-4 h-4" />
                : <XCircle className="w-4 h-4" />
              }
              {testResult.message}
            </div>
            {testResult.connected && testResult.inbox && (
              <p className="text-xs">
                Inbox: {testResult.inbox.total} total · {testResult.inbox.unseen} unread
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            className="btn-secondary flex-1 justify-center"
            onClick={handleTestConnection}
            disabled={testing || !gmailUser || (changingPassword && !appPass && !settings.gmailAppPasswordSet)}
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save & Apply'}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Auto-Send Section ──────────────────────────────────────────────────────────

function AutoSendSection({ settings }: { settings: AppSettingsData }) {
  const qc = useQueryClient();
  const [autoSend, setAutoSend] = useState(settings.autoSendEnabled);

  useEffect(() => { setAutoSend(settings.autoSendEnabled); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (val: boolean) => settingsApi.update({ autoSendEnabled: val }),
    onSuccess: (_, val) => {
      toast.success(val ? 'Auto-send enabled' : 'Auto-send disabled');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleToggle = () => {
    const newVal = !autoSend;
    setAutoSend(newVal);
    saveMutation.mutate(newVal);
  };

  return (
    <SectionCard icon={Send} title="Auto-Send to Authority">
      <div className={`p-4 rounded-lg border mb-4 ${autoSend ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {autoSend
            ? <Zap className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <ZapOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
          }
          <div className="flex-1">
            <p className={`text-sm font-semibold ${autoSend ? 'text-green-900' : 'text-gray-700'}`}>
              {autoSend ? 'Auto-send is ON' : 'Auto-send is OFF'}
            </p>
            <p className={`text-xs mt-0.5 ${autoSend ? 'text-green-700' : 'text-gray-500'}`}>
              {autoSend
                ? 'Incoming emails will be automatically forwarded to the relevant authority'
                : 'Manual approval required before sending to authority'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable Auto-Send</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When ON — new emails are analyzed by AI and forwarded to the right authority automatically
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saveMutation.isPending}
          className={`relative w-11 h-6 rounded-full transition-colors ${autoSend ? 'bg-brand-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSend ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {autoSend && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Caution:</strong> With auto-send ON, all incoming complaint emails will be
              forwarded to authorities without manual review. Only enable if Gmail is
              configured as a dedicated complaint inbox.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-1.5 text-xs text-gray-600">
        <p className="font-medium text-gray-700">How it works:</p>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-semibold flex-shrink-0">1</span>
          Email arrives in Gmail inbox
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-semibold flex-shrink-0">2</span>
          AI analyzes and classifies the complaint
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-semibold flex-shrink-0">3</span>
          Matching authority found from database
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0 ${autoSend ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>4</span>
          <span className={autoSend ? 'text-green-700 font-medium' : ''}>
            {autoSend ? '✓ Auto-forwarded to authority email' : 'Waits for manual approval in dashboard'}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

// ── IMAP Activity Log ──────────────────────────────────────────────────────────

function ImapActivityLog() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['imapStats'],
    queryFn:  () => settingsApi.imapStats().then((r) => r.data.data),
    refetchInterval: 15000,
  });

  return (
    <SectionCard icon={Inbox} title="Email Ingestion Log">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {data?.totalIngested ?? 0} emails ingested total
        </p>
        <button onClick={() => refetch()} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !data?.recentIngestions?.length ? (
        <div className="text-center py-8 text-gray-400">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No emails ingested yet</p>
          <p className="text-xs mt-1">Configure Gmail above and send a test email to complaints@gmail.com</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {data.recentIngestions.map((item, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-gray-500 truncate">{item.messageId}</p>
                {item.complaintId && (
                  <p className="text-xs text-brand-600 mt-0.5">→ Complaint created</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(item.processedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Main Settings page ─────────────────────────────────────────────────────────

export function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => settingsApi.get().then((r) => r.data.data),
  });

  const [threshold, setThreshold] = useState(85);
  useEffect(() => {
    if (settings) setThreshold(Math.round(settings.aiConfidenceThreshold * 100));
  }, [settings]);

  const saveAiMutation = useMutation({
    mutationFn: () => settingsApi.update({ aiConfidenceThreshold: threshold / 100 }),
    onSuccess:  () => { toast.success('AI settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>

      {/* Profile */}
      <SectionCard icon={User} title="User Profile">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" defaultValue={user?.name} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={user?.email} disabled />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input" defaultValue={user?.role} disabled />
          </div>
        </div>
      </SectionCard>

      {/* Gmail Inbox */}
      {settings && <GmailSection settings={settings} />}

      {/* Auto-Send Section */}
      {settings && <AutoSendSection settings={settings} />}

      {/* IMAP Activity Log */}
      <ImapActivityLog />

      {/* AI Settings */}
      <SectionCard icon={Brain} title="AI Settings">
        <div className="space-y-4">
          <div>
            <label className="label">
              Confidence Threshold: <strong>{threshold}%</strong>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Complaints below this threshold are flagged for human review
            </p>
            <input
              type="range" min={50} max={100} step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>50% (lenient)</span><span>100% (strict)</span>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => saveAiMutation.mutate()}
            disabled={saveAiMutation.isPending}
          >
            {saveAiMutation.isPending ? 'Saving…' : 'Save AI Settings'}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
