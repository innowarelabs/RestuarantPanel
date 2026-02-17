import React from 'react';

const SupportToggle = ({ activeTab, onToggle }) => {
    return (
        <div className="inline-flex p-1 bg-gray-100 rounded-xl mb-8">
            <button
                onClick={() => onToggle('customer')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'customer'
                        ? 'bg-white text-general-text shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Customer Support
            </button>
            <button
                onClick={() => onToggle('admin')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'admin'
                        ? 'bg-white text-general-text shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Admin Support
            </button>
        </div>
    );
};

export default SupportToggle;
