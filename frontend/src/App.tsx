import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { PortfolioOverviewView } from './components/PortfolioOverviewView';
import { ProjectExplorerView } from './components/ProjectExplorerView';
import { RiskPredictionView } from './components/RiskPredictionView';
import { EarlyWarningsView } from './components/EarlyWarningsView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { DisasterSimulationView } from './components/DisasterSimulationView';

const STORAGE_KEY = 'infrarisk_active_tab';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as TabType;
    const validTabs: TabType[] = ['overview', 'explorer', 'prediction', 'warnings', 'evaluation', 'disaster'];
    return validTabs.includes(saved) ? saved : 'overview';
  });

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && <PortfolioOverviewView />}
        {currentTab === 'explorer' && <ProjectExplorerView />}
        {currentTab === 'prediction' && <RiskPredictionView />}
        {currentTab === 'warnings' && <EarlyWarningsView />}
        {currentTab === 'evaluation' && <ModelEvaluationView />}
        {currentTab === 'disaster' && <DisasterSimulationView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            InfraRisk AI &copy; 2026 &bull; Academic Research Prototype inspired by MoSPI & PAIMANA
          </span>
          <span className="text-[11px] text-slate-400">
            Frontend :3000 &bull; FastAPI Backend :8001 &bull; 2,000 Synthetic Projects (Seed 42)
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
