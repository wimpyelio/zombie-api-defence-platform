import React from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { EndpointExplorer } from './pages/EndpointExplorer';
import { DecommissionTracker } from './pages/DecommissionTracker';
import { ComplianceReport } from './pages/ComplianceReport';
import { KnowledgeGraphView } from './pages/KnowledgeGraphView';
import './App.css';

export function App() {
  const [activePage, setActivePage] = React.useState<'dashboard' | 'endpoints' | 'decommission' | 'compliance' | 'graph'>('dashboard');

  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'endpoints', label: 'Endpoints', icon: 'server' },
    { id: 'decommission', label: 'Decommission', icon: 'archive' },
    { id: 'compliance', label: 'Compliance', icon: 'shield-check' },
    { id: 'graph', label: 'Knowledge Graph', icon: 'git-branch' },
  ];

  const pageComponents = {
    dashboard: <Dashboard />,
    endpoints: <EndpointExplorer />,
    decommission: <DecommissionTracker />,
    compliance: <ComplianceReport />,
    graph: <KnowledgeGraphView />,
  };

  const handleNavigate = (page: string) => {
    setActivePage(page as 'dashboard' | 'endpoints' | 'decommission' | 'compliance' | 'graph');
  };

  return (
    <div className="app">
      <Header activePage={activePage} onNavigate={handleNavigate} pages={pages} />
      <main className="main-content">
        <div className="container">
          {pageComponents[activePage]}
        </div>
      </main>
      <Footer />
    </div>
  );
}