import React, { useMemo, useState, useEffect } from 'react';
import { generateMockData } from './services/mockData';
import { KPICard, Heatmap, AIRecommendations } from './components/DashboardComponents';
import ConnectionModal from './components/ConnectionModal';
import { Layers, AlertTriangle, Package, Activity, Settings } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Connection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snowflakeKey, setSnowflakeKey] = useState('');

  // Load key from storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('snowflake_key');
    if (savedKey) setSnowflakeKey(savedKey);
  }, []);

  // Clean simpler version of fetching data
  const loadData = React.useCallback(async (key) => {
    try {
      const { fetchDashboardData } = await import('./services/api');
      // Use the key passed in, or state key
      const activeKey = key !== undefined ? key : snowflakeKey;

      const result = await fetchDashboardData(activeKey);
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      // Fallback to mock data if API fails
      const { generateMockData } = await import('./services/mockData');
      setData(generateMockData());

      // If error is 401/403, it might be auth
      if (err.message.includes('401') || err.message.includes('503')) {
        setError("Connection failed. Please check API Key.");
      } else {
        setError("Using mock data (Backend unavailable)");
      }
    } finally {
      setLoading(false);
    }
  }, [snowflakeKey]);

  useEffect(() => {
    loadData();
    // Poll every 30 seconds
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveKey = (key) => {
    setSnowflakeKey(key);
    localStorage.setItem('snowflake_key', key);
    setIsModalOpen(false);
    // Immediately try to reload with new key
    setLoading(true);
    loadData(key);
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { critical: 0, warning: 0, totalItems: 0 };
    const critical = data.filter(d => d.status === 'CRITICAL').length;
    const warning = data.filter(d => d.status === 'WARNING').length;
    const totalItems = data.length;
    return { critical, warning, totalItems };
  }, [data]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ['Item', 'Location', 'Category', 'Stock', 'Days Remaining', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.itemName}"`,
        `"${row.locationName}"`,
        `"${row.category}"`,
        row.closingStock,
        row.daysRemaining,
        row.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-health-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-4 bg-gray-50/50">
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveKey}
        savedKey={snowflakeKey}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-6 mb-4 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {/* <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-600/20">
                <Activity size={20} />
              </div> */}
              <div>
                <h1 className="text-lg font-bold m-0 leading-tight text-gray-900">Stock Health AI</h1>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Inventory Command Center</p>
              </div>
            </div>

            {/* Export Controls - Moved to Left */}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="btn btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 h-auto min-h-0 border border-gray-200 bg-white hover:bg-gray-50"
                title="Download CSV"
              >
                <Package size={14} />
                CSV
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 h-auto min-h-0 border border-gray-200 bg-white hover:bg-gray-50"
                title="Print / Save PDF"
              >
                <Layers size={14} />
                PDF
              </button>
            </div>
          </div>

          {/* <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-ghost text-xs flex items-center gap-2 px-3 py-1.5 h-auto min-h-0 text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            >
              <Settings size={14} />
              Configure Connection
            </button>
            <div className="h-8 w-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md border-2 border-white">U</div>
          </div> */}
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KPICard
            title="Critical Stock-outs"
            value={stats.critical}
            icon={AlertTriangle}
            color="red"
          />
          <KPICard
            title="Low Stock Warnings"
            value={stats.warning}
            icon={Layers}
            color="yellow"
          />
          <KPICard
            title="Total Stock Units"
            value={stats.totalItems}
            icon={Package}
            color="blue"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>

          <div className="flex flex-col gap-4">
            {/* Visual Heatmap */}
            <Heatmap data={data} />

            {/* Detailed List */}
            <div className="card shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-gray-800">Inventory At Risk</h2>
                <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
                  {stats.critical + stats.warning} items need attention
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="py-2 pl-2 font-semibold">Item</th>
                      <th className="py-2 font-semibold">Location</th>
                      <th className="py-2 text-right font-semibold">Stock</th>
                      <th className="py-2 text-right font-semibold">Days Left</th>
                      <th className="py-2 text-center font-semibold pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {data
                      .filter(d => d.status !== 'OK')
                      .sort((a, b) => a.daysRemaining - b.daysRemaining)
                      .slice(0, 8) // Limit to 8 to save space
                      .map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                          <td className="py-2.5 pl-2 font-medium text-gray-900">{row.itemName}</td>
                          <td className="py-2.5 text-gray-500">{row.locationName}</td>
                          <td className="py-2.5 text-right font-mono text-gray-700">{row.closingStock}</td>
                          <td className="py-2.5 text-right font-bold text-gray-900">{row.daysRemaining}</td>
                          <td className="py-2.5 text-center pr-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              row.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* AI Panel */}
            <AIRecommendations stockData={data} />

            {/* Quick Info / Context */}
            <div className="card bg-slate-900 text-white shadow-xl shadow-slate-900/20 border-0">
              <h3 className="text-white mb-3 text-sm font-semibold tracking-wide uppercase opacity-80">System Status</h3>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Data Source - </span>
                  <span className={`flex items-center gap-2 font-medium ${error ? "text-amber-400" : "text-emerald-400"}`}>
                    <span className={`h-2 w-2 rounded-full ${error ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                    {error ? "Backup (Mock)" : "Connected"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Last Sync - </span>
                  <span className="font-mono opacity-80">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Snowflake Task - </span>
                  <span className="text-emerald-400 font-medium">Active</span>
                </div>
                <div className="pt-3 mt-2 border-t border-slate-700/50">
                  <p className="text-[11px] leading-relaxed opacity-70 italic">
                    <strong>Tip:</strong> Use the "Generate Insights" button to ask Gemini / OpenAI for a procurement plan.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
