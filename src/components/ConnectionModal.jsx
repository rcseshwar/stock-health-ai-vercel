import React, { useState } from 'react';
import { Key, Lock } from 'lucide-react';

const ConnectionModal = ({ isOpen, onClose, onSave, savedKey }) => {
    const [apiKey, setApiKey] = useState(savedKey || '');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Key size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Connection Setup</h2>
                        <p className="text-sm text-gray-500">Secure Snowflake Access</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Snowflake API Key (Password)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={16} />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your Snowflake Key/Password..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            This key is used to authenticate with your Snowflake Warehouse securely.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(apiKey)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Connect & Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionModal;
