import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  BookmarkCheck,
  Image as ImageIcon,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Orders & Shipping', path: '/orders', icon: Package },
    { label: 'Products', path: '/products', icon: Boxes },
    { label: 'Categories', path: '/categories', icon: Layers },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Coupons & Offers', path: '/coupons', icon: BookmarkCheck },
    { label: 'Collections', path: '/collections', icon: BookmarkCheck },
    { label: 'Homepage Banners', path: '/banners', icon: ImageIcon },
    { label: 'Staff & Roles', path: '/admins', icon: Users },
    { label: 'Store Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-brand-burgundy flex items-center justify-center text-white font-serif font-bold text-lg">
              C
            </div>
            <div>
              <span className="font-serif text-lg tracking-wider font-bold text-white block leading-none">
                CHANDRAKOR
              </span>
              <span className="text-[10px] tracking-widest uppercase text-brand-gold font-medium">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-burgundy text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-gold" />}
              </Link>
            );
          })}

          {/* Phase 2 Live Badges */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 px-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">
              Phase 2 Operational
            </span>
            <div className="flex items-center justify-between py-1 text-xs text-slate-400">
              <span>Razorpay & COD</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Live</span>
            </div>
            <div className="flex items-center justify-between py-1 text-xs text-slate-400">
              <span>Atomic Stock Lock</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Active</span>
            </div>
          </div>
        </nav>

        {/* Live Storefront Link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Customer Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-xs text-slate-500">
              <span>Chandrakor Operations</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-slate-800 capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
              </span>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-800">{admin?.full_name || 'Admin'}</span>
              <span className="inline-block px-1.5 py-0.2 text-[10px] bg-slate-100 text-brand-burgundy font-medium rounded">
                {role?.name || 'Administrator'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-3 text-xs rounded hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
};
