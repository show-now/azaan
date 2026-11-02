import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { PortfolioOverviewView } from './components/PortfolioOverviewView';
import { ProjectExplorerView } from './components/ProjectExplorerView';
import { RiskPredictionView } from './components/RiskPredictionView';
import { EarlyWarningsView } from './components/EarlyWarningsView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { DisasterSimulationView } from './components/DisasterSimulationView';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

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
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
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
