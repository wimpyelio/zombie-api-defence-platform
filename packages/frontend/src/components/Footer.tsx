import { Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="currentColor"/>
              <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 8V16M8 12L16 16M24 12L16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3>ZAD Platform</h3>
            <p>Zombie API Defence for regulated environments</p>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Product">
          <h4>Product</h4>
          <ul>
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#endpoints">Endpoint Explorer</a></li>
            <li><a href="#decommission">Decommission Tracker</a></li>
            <li><a href="#compliance">Compliance Reports</a></li>
            <li><a href="#graph">Knowledge Graph</a></li>
          </ul>
        </nav>

        <nav className="footer-nav" aria-label="Resources">
          <h4>Resources</h4>
          <ul>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Documentation <ExternalLink size={12} /></a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">API Reference <ExternalLink size={12} /></a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Blog <ExternalLink size={12} /></a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Security <ExternalLink size={12} /></a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Changelog <ExternalLink size={12} /></a></li>
          </ul>
        </nav>

        <nav className="footer-nav" aria-label="Company">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </nav>

        <div className="footer-social">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={20} /></a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
          <p className="footer-tagline">Built for banks, fintechs, and healthcare</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2025 ZAD Platform. All rights reserved.</p>
          <p className="footer-version">v0.1.0 • Open source under MIT License</p>
        </div>
      </div>
    </footer>
  );
}