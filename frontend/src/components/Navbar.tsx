import React from 'react';
import { 
  Building2, 
  Search, 
  Calculator, 
  AlertTriangle, 
  LineChart, 
  Activity,
  Flame
} from 'lucide-react';

export type TabType = 'overview' | 'explorer' | 'prediction' | 'warnings' | 'evaluation' | 'disaster';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Portfolio Overview', icon: <Building2 className="w-4 h-4" /> },
    { id: 'explorer', label: '2. Project Explorer', icon: <Search className="w-4 h-4" /> },
    { id: 'prediction', label: '3. Risk Prediction', icon: <Calculator className="w-4 h-4" /> },
    { id: 'warnings', label: '4. Early Warnings', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'evaluation', label: '5. Model Evaluation', icon: <LineChart className="w-4 h-4" /> },
    { id: 'disaster', label: '6. Disaster Simulation', icon: <Flame className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-lg shadow-md shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  InfraRisk AI
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/80 rounded-full">
                  MoSPI / PAIMANA Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Infrastructure Cost & Delay Early Warning System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

