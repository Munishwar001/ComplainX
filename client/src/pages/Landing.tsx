import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, ArrowRight, Brain, Building2, CheckCircle, Mail,
  Trash2, AlertTriangle, Lightbulb, Droplets, Bolt, Car, Wrench, MoreHorizontal,
} from 'lucide-react';

const steps = [
  { icon: Mail, label: 'Your Complaint', desc: 'Send an email or use the web form' },
  { icon: Brain, label: 'AI Analysis', desc: 'Classified and structured automatically' },
  { icon: Building2, label: 'Authority Detection', desc: 'Right department identified' },
  { icon: CheckCircle, label: 'Human Approval', desc: 'You review before anything is sent' },
  { icon: Zap, label: 'Authority Notified', desc: 'Professional complaint delivered' },
  { icon: ArrowRight, label: 'Track Resolution', desc: 'Follow the status end to end' },
];

const issues = [
  { icon: Trash2, label: 'Garbage & Waste', color: 'bg-green-50 text-green-600' },
  { icon: AlertTriangle, label: 'Roads', color: 'bg-orange-50 text-orange-600' },
  { icon: Lightbulb, label: 'Street Lights', color: 'bg-yellow-50 text-yellow-600' },
  { icon: Droplets, label: 'Water', color: 'bg-blue-50 text-blue-600' },
  { icon: Bolt, label: 'Electricity', color: 'bg-purple-50 text-purple-600' },
  { icon: Car, label: 'Traffic', color: 'bg-red-50 text-red-600' },
  { icon: Wrench, label: 'Public Infrastructure', color: 'bg-gray-50 text-gray-600' },
  { icon: MoreHorizontal, label: 'Other Civic Issues', color: 'bg-brand-50 text-brand-600' },
];

const whyItems = [
  'One place for all complaints',
  'AI-powered classification',
  'Smart authority routing',
  'Human approval before sending',
  'End-to-end complaint tracking',
  'Transparent status history',
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">ComplanX</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary py-1.5 text-sm">Log in</Link>
          <Link to="/register" className="btn-primary py-1.5 text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Civic Complaint Platform
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Your complaint.<br />
          <span className="text-brand-600">AI analyzed.</span> Right authority notified.
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Send your complaint once. ComplanX understands the issue, identifies the appropriate
          authority, prepares the complaint, and helps you track what happens next.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dev/email-simulator" className="btn-primary px-6 py-2.5 text-sm">
            Report a Complaint
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="btn-secondary px-6 py-2.5 text-sm">
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* Process */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How ComplanX Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <step.icon className="w-5 h-5 text-brand-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Issue Types */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Supported Issues</h2>
        <p className="text-center text-gray-500 mb-10">We route complaints for all major civic categories</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {issues.map((issue) => (
            <div key={issue.label} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${issue.color}`}>
                <issue.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-900">{issue.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Why ComplanX?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {whyItems.map((item) => (
              <div key={item} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3">
                <CheckCircle className="w-4 h-4 text-brand-200 flex-shrink-0" />
                <span className="text-sm text-white">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center gap-3">
            <Link to="/register" className="bg-white text-brand-700 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 ComplanX. Built for the hackathon.
      </footer>
    </div>
  );
}
