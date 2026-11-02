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
    { id: 'disaster', label: '6. Disaster Simulation', icon: <Flame className="w-4 h-4 text-rose-500" /> },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-lg shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
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
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
