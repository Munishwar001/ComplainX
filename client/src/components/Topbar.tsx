import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/complaints': 'Complaints',
  '/complaints/new': 'New Complaint',
  '/authorities': 'Authorities',
  '/settings': 'Settings',
  '/admin': 'Admin Dashboard',
  '/admin/authorities': 'Manage Authorities',
  '/dev/email-simulator': 'Email Simulator',
};

export function Topbar() {
  const location = useLocation();
  const { user } = useAuth();

  const title = Object.entries(PAGE_TITLES).find(([key]) => location.pathname === key)?.[1]
    || (location.pathname.startsWith('/complaints/') ? 'Complaint Details' : 'ComplanX');

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <Link to="/complaints/new" className="btn-primary py-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Complaint
        </Link>
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-brand-700">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
