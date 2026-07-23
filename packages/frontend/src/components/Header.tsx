import React from 'react';
import { LayoutDashboard, Server, Archive, ShieldCheck, GitBranch } from 'lucide-react';

interface HeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
  pages: Array<{ id: string; label: string; icon: string }>;
}

const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={18} />,
  'server': <Server size={18} />,
  'archive': <Archive size={18} />,
  'shield-check': <ShieldCheck size={18} />,
  'git-branch': <GitBranch size={18} />,
};

export function Header({ activePage, onNavigate, pages }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="container header-content">
        <div className="header-brand" onClick={() => onNavigate('dashboard')}>
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="currentColor"/>
              <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 8V16M8 12L16 16M24 12L16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="brand-text">ZAD Platform</span>
          <span className="brand-tagline">Zombie API Defence</span>
        </div>

        <nav className="header-nav" role="navigation" aria-label="Main navigation">
          {pages.map(page => (
            <button
              key={page.id}
              className={`nav-item ${activePage === page.id ? 'active' : ''}`}
              onClick={() => onNavigate(page.id)}
              aria-current={activePage === page.id ? 'page' : undefined}
            >
              {iconMap[page.icon]}
              <span>{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className="status-indicator">
            <span className="status-dot live"></span>
            <span className="status-text">Live</span>
          </div>
          <button className="btn btn-secondary btn-sm">Documentation</button>
          <button className="btn btn-primary btn-sm">Start Scan</button>
        </div>
      </div>
    </header>
  );
}