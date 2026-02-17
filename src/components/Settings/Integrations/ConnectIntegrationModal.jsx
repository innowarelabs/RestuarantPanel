import React, { useState } from 'react';
import { X } from 'lucide-react';

const ConnectIntegrationModal = ({ isOpen, onClose, platformName }) => {
    const [formData, setFormData] = useState({
        apiKey: '',
        storeId: '',
        secretToken: '',
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Connect {platformName}</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Enter your credentials to sync orders and data.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* API Key */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">API Key <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter API key"
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Store ID */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Store ID <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter store ID"
                            value={formData.storeId}
                            onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Secret Token */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[500] text-[#374151]">Secret Token</label>
                        <input
                            type="text"
                            placeholder="Enter secret token"
                            value={formData.secretToken}
                            onChange={(e) => setFormData({ ...formData, secretToken: e.target.value })}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white shadow-inner">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        Connect {platformName}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectIntegrationModal;
