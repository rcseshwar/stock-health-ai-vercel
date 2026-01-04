import React, { useState } from 'react';
import { analyzeStockRisks } from '../services/llmService';
import { AlertTriangle, BrainCircuit, Check, Loader2, Maximize2, X } from 'lucide-react';

export const KPICard = ({ title, value, icon: Icon, color }) => (
    <div className="card flex items-center gap-3 p-4">
        <div className={`p-2.5 rounded-full bg-${color}-100 text-${color}-600`}>
            {Icon && <Icon size={20} />}
        </div>
        <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wide">{title}</p>
            <h3 className="text-xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

export const Heatmap = ({ data }) => {
    // Group by location for simpler grid visualization
    // In a real heatmap, we'd have axes, but here we'll do a simple card grid per item
    return (
        <div className="card">
            <h2>Stock Health Heatmap</h2>
            <div className="heatmap-grid">
                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className={`heatmap-cell ${item.status.toLowerCase()}`}
                        title={`Location: ${item.locationName}\nItem: ${item.itemName}\nDays Left: ${item.daysRemaining}`}
                    >
                        <span className="text-xs">{item.locationName.split(' ')[0]}</span>
                        <strong>{item.itemName.split(' ')[0]}</strong>
                        <span className="text-lg">{item.daysRemaining}d</span>
                    </div>
                ))}
            </div>
            <br />
            <div className="legend">
                <div className="legend-item">
                    <div className="dot red" />
                    <span>Critical (&lt;7d)</span>
                </div>

                <div className="legend-item">
                    <div className="dot yellow" />
                    <span>Warning (&lt;14d)</span>
                </div>

                <div className="legend-item">
                    <div className="dot green" />
                    <span>Healthy</span>
                </div>
            </div>
        </div>
    );
};

export const AIRecommendations = ({ stockData }) => {
    const [apiKey, setApiKey] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAnalyze = async () => {
        if (!apiKey) {
            setShowKeyInput(true);
            return;
        }
        setLoading(true);
        try {
            const result = await analyzeStockRisks(apiKey, stockData, 'openai'); // defaulting to gemini for demo
            setAnalysis(result);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="card border-blue-200 bg-blue-50 relative">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-blue-900">
                            <BrainCircuit className="text-blue-600" />
                            AI Stock Analyst
                        </h2>
                        <p className="text-blue-700 text-sm">Get intelligent reorder suggestions and risk summaries.</p>
                    </div>
                    <div className="flex gap-2">
                        {analysis && !isExpanded && (
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="btn btn-ghost p-1 text-blue-600 hover:bg-blue-100 rounded-lg"
                                title="Expand"
                            >
                                <Maximize2 size={18} />
                            </button>
                        )}
                        {!showKeyInput && !analysis && (
                            <button onClick={handleAnalyze} className="btn btn-primary bg-blue-600 hover:bg-blue-700">
                                {loading ? <Loader2 className="animate-spin" /> : 'Generate Insights'}
                            </button>
                        )}
                    </div>
                </div>

                {showKeyInput && !analysis && (
                    <div className="mb-4">
                        <label className="text-xs font-bold text-blue-800 uppercase">Enter Gemini/OpenAI API Key</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="password"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-white"
                            />
                            <button onClick={handleAnalyze} className="btn btn-primary" disabled={!apiKey || loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Go'}
                            </button>
                        </div>
                        <p className="text-xs text-blue-500 mt-1">Keys are not stored and used only for this session.</p>
                    </div>
                )}

                {analysis && (
                    <div className="bg-white p-4 rounded-lg border border-blue-100 prose prose-sm max-w-none max-h-64 overflow-y-auto">
                        <div className="whitespace-pre-wrap">{analysis}</div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setAnalysis(null)} className="btn btn-outline text-xs">Clear</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded Modal Overlay */}
            {isExpanded && analysis && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="w-full h-full flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="flex items-center gap-2 text-blue-900 text-xl font-bold">
                                <BrainCircuit className="text-blue-600" />
                                AI Stock Analysis
                            </h2>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 prose prose-lg max-w-none">
                            <div className="whitespace-pre-wrap leading-relaxed space-y-4">
                                {analysis.replace(/\n- /g, '\n\n- ').replace(/\n\* /g, '\n\n* ')}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                            <button onClick={() => setIsExpanded(false)} className="btn btn-primary bg-blue-600 text-white">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
