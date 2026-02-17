import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteRewardModal = ({ isOpen, onClose, onConfirm, rewardName }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        {React.createElement(AlertTriangle, { className: "w-6 h-6 text-[#EF4444]" })}
                    </div>
                    <h2 className="text-2xl font-bold text-general-text mb-3">
                        Delete {rewardName ? `"${rewardName}"` : 'Reward'}?
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        This reward will no longer be available to customers. This action cannot be undone.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-[#EF4444] text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteRewardModal;
