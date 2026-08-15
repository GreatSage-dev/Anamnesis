import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ArcBackground from '../components/ArcBackground';

/**
 * Anamnesis Dashboard Layout
 * Wraps all /anamnesis/* pages with sidebar, arc background, and system status polling.
 */

export default function AnamnesisLayout() {
  const [systemStatus, setSystemStatus] = useState({
    cockroachdb: false,
    bedrock: false,
    xlayer: false,
  });

  useEffect(() => {
    // Quick health check on mount
    fetch('/api/anamnesis/system')
      .then((r) => r.json())
      .then((data) => {
        setSystemStatus({
          cockroachdb: data.cockroachdb?.connected || false,
          bedrock: data.bedrock?.connected || false,
          xlayer: data.xlayer?.connected || false,
        });
      })
      .catch(() => {
        // Silently fail — status dots will show as unknown
      });
  }, []);

  return (
    <div className="anamnesis-root">
      <ArcBackground />
      <Sidebar systemStatus={systemStatus} />
      <main className="anamnesis-main">
        <Outlet />
      </main>
    </div>
  );
}
