import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Copy, Trash2 } from 'lucide-react';

export default function EditMenuItemModal({ isOpen, onClose, item }) {
    const [openSections, setOpenSections] = useState({
        basic: true,
        pricing: true,
        addons: false,
        inventory: false,
        images: false,
        tags: false,
        availability: false
    });

    const [hasVariants, setHasVariants] = useState(false);

    if (!isOpen) return null;

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[16px] w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[18px] font-bold text-[#111827]">Edit Item</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-white">

                    {/* Basic Details Section */}
                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button
                            onClick={() => toggleSection('basic')}
                            className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-[14px] font-semibold text-[#111827]">Basic Details</span>
                            {openSections.basic ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>

                        {openSections.basic && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Item Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        defaultValue={item?.name || "Zinger Burger"}
                                        className="w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        className="w-full h-[40px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add a description..."
                                        className="w-full p-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Section */}
                    <div className="border border-gray-100 rounded-[8px] overflow-hidden">
                        <button
                            onClick={() => toggleSection('pricing')}
                            className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-[14px] font-semibold text-[#111827]">Pricing</span>
                            {openSections.pricing ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>

                        {openSections.pricing && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                {/* Enable Variants Toggle */}
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-[8px]">
                                    <div>
                                        <h4 className="text-[13px] font-semibold text-[#111827]">Enable Variants</h4>
                                        <p className="text-[11px] text-gray-500">Multiple sizes or options</p>
                                    </div>
                                    <div
                                        className={`w-[36px] h-[20px] rounded-full p-0.5 cursor-pointer transition-colors ${hasVariants ? 'bg-[#2BB29C]' : 'bg-gray-200'}`}
                                        onClick={() => setHasVariants(!hasVariants)}
                                    >
                                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${hasVariants ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Price <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                        <input
                                            type="text"
                                            defaultValue={item?.price?.replace('$', '') || "12.99"}
                                            className="w-full h-[40px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collapsed Sections */}
                    {['Add-ons', 'Inventory', 'Images', 'Tags', 'Availability Schedule'].map(section => {
                        const key = section.toLowerCase().replace(' ', '').replace('-', '');
                        return (
                            <div key={key} className="border border-gray-100 rounded-[8px] overflow-hidden">
                                <button
                                    onClick={() => toggleSection(key)}
                                    className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-[14px] font-semibold text-[#111827]">{section}</span>
                                    {openSections[key] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                </button>
                                {openSections[key] && (
                                    <div className="p-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">Section content...</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition-colors">
                            <Copy size={14} />
                            Duplicate
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 rounded-[8px] text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button className="px-4 py-2.5 bg-[#2BB29C] rounded-[8px] text-[13px] font-medium text-white hover:bg-[#259D89] transition-colors shadow-sm">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
