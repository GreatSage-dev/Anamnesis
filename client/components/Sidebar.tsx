import React from 'react';
import { NavLink } from 'react-router-dom';
import AnamnesisLogo from './AnamnesisLogo';

interface SidebarProps {
  systemStatus?: {
    cockroachdb: boolean;
    bedrock: boolean;
    xlayer: boolean;
  };
}

export default function Sidebar({ systemStatus }: SidebarProps) {
  return (
    <aside className="anamnesis-sidebar">
      <NavLink to="/" className="sidebar-brand">
        <AnamnesisLogo size={36} showOrb={true} />
        <span className="sidebar-brand-name">Anamnesis</span>
      </NavLink>

      <nav className="sidebar-nav">
        <span className="sidebar-label">Dashboard</span>

        <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
          Overview
        </NavLink>

        <NavLink to="/dashboard/demo" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5,3 13,8 5,13"/>
          </svg>
          Live Demo
        </NavLink>

        <NavLink to="/dashboard/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h12M2 12h8"/>
          </svg>
          Audit Trail
        </NavLink>

        <NavLink to="/dashboard/system" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/>
          </svg>
          System
        </NavLink>
      </nav>

      <div className="sidebar-status">
        <div className="sidebar-status-item">
          <span className={`status-dot ${systemStatus?.cockroachdb ? 'connected' : 'unknown'}`} />
          CockroachDB
        </div>
        <div className="sidebar-status-item">
          <span className={`status-dot ${systemStatus?.bedrock ? 'connected' : 'unknown'}`} />
          Bedrock
        </div>
        <div className="sidebar-status-item">
          <span className={`status-dot ${systemStatus?.xlayer ? 'connected' : 'unknown'}`} />
          X Layer
        </div>
      </div>
    </aside>
  );
}
