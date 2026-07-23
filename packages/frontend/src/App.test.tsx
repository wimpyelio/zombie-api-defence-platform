import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { App } from './App';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByRole('button', { name: /Endpoints/i })).toBeInTheDocument();
  });

  it('renders header with navigation', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    expect(within(nav).getByRole('button', { name: /Endpoints/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Decommission/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Compliance/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Knowledge Graph/i })).toBeInTheDocument();
  });
});

describe('Header', () => {
  it('renders navigation tabs', () => {
    render(<Header activePage="dashboard" onNavigate={vi.fn()} pages={[{id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard'}]} />);
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('calls onNavigate when tab clicked', () => {
    const onNavigate = vi.fn();
    render(<Header activePage="dashboard" onNavigate={onNavigate} pages={[
      {id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard'},
      {id: 'endpoints', label: 'Endpoints', icon: 'server'},
    ]} />);
    const explorerTab = screen.getByRole('button', { name: /Endpoints/i });
    explorerTab.click();
    expect(onNavigate).toHaveBeenCalledWith('endpoints');
  });
});

describe('Footer', () => {
  it('renders footer links', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /ZAD Platform/i })).toBeInTheDocument();
    expect(screen.getByText(/Endpoint Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Documentation/i)).toBeInTheDocument();
  });
});