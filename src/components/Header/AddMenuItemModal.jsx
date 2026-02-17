import React, { useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';

export default function AddMenuItemModal({ isOpen, onClose }) {
    const [hasVariants, setHasVariants] = useState(false);
    const [trackInventory, setTrackInventory] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const [variants, setVariants] = useState([{ name: '', price: '', sku: '' }]);

    if (!isOpen) return null;

    const addVariant = () => {
        setVariants([...variants, { name: '', price: '', sku: '' }]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Add Menu Item</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Add a new item to a category. Fields with <span className="text-red-500">*</span> are required.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Item Name */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Item Name <span className="text-red-500">*</span></label>
                            <span className="text-[12px] text-gray-400">0/100 characters</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Zinger Burger"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Category <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors appearance-none cursor-pointer shadow-sm">
                                <option value="" disabled selected>Select a category...</option>
                                <option value="burgers">Burgers</option>
                                <option value="pizza">Pizza</option>
                                <option value="drinks">Drinks</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-[14px] font-[500] text-[#374151]">Description</label>
                            <span className="text-[12px] text-gray-400">0/200 characters</span>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Describe your menu item..."
                            className="w-full p-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400 resize-none shadow-sm"
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Images</label>
                        <div className="border border-dashed border-[#E5E7EB] rounded-[12px] h-[140px] flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5 text-[#6B7280]" />
                            </div>
                            <p className="text-[14px] text-[#374151] font-medium">Drag & drop images here or <span className="text-[#2BB29C]">browse</span></p>
                            <p className="text-[12px] text-gray-400 mt-1">Square images preferred • Max 8 images • 3MB each</p>
                        </div>
                    </div>

                    {/* Has Variants Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Has Variants?</h4>
                            <p className="text-[12px] text-gray-500">E.g., Small, Medium, Large</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${hasVariants ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setHasVariants(!hasVariants)}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${hasVariants ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Variants Section */}
                    {hasVariants ? (
                        <div className="space-y-3">
                            <label className="block text-[14px] font-[500] text-[#374151]">Variants <span className="text-red-500">*</span></label>
                            {variants.map((variant, idx) => (
                                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        type="text"
                                        placeholder="Size name"
                                        className="flex-1 h-[42px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                    />
                                    <div className="relative w-[120px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            className="w-full h-[42px] pl-7 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        className="w-[100px] h-[42px] px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                    />
                                </div>
                            ))}
                            <button onClick={addVariant} className="flex items-center gap-1 text-[13px] font-medium text-[#2BB29C] hover:text-[#249A88] active:scale-95 transition-transform">
                                <Plus size={14} /> Add variant
                            </button>
                        </div>
                    ) : (
                        /* Price input if no variants */
                        <div>
                            <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Price <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full h-[46px] pl-8 pr-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Add-ons */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Add-ons (Modifiers)</label>
                        <button className="flex items-center gap-1 text-[13px] font-medium text-[#2BB29C] hover:text-[#249A88] active:scale-95 transition-transform">
                            <Plus size={14} /> Add an add-on
                        </button>
                    </div>

                    {/* Prep Time */}
                    <div>
                        <label className="block text-[14px] font-[500]d text-[#374151] mb-1.5">Prep Time (minutes)</label>
                        <input
                            type="text"
                            placeholder="15"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors shadow-sm"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-[14px] font-[500] text-[#374151] mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {['Vegan', 'Spicy', 'Halal', 'Gluten-free'].map(tag => (
                                <button key={tag} className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] rounded-[6px] text-[13px] font-medium hover:bg-[#2BB29C] hover:text-white transition-all active:scale-95">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Track Inventory */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Track Inventory</h4>
                            <p className="text-[12px] text-gray-500">Monitor stock levels for this item</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${trackInventory ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setTrackInventory(!trackInventory)}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${trackInventory ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Inventory Fields */}
                    {trackInventory && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex-1">
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Stock Quantity</label>
                                <input
                                    type="text"
                                    placeholder="100"
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[14px] font-[500] text-[#374151] mb-1.5">Low Stock Alert</label>
                                <input
                                    type="text"
                                    placeholder="10"
                                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Available */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[12px]">
                        <div>
                            <h4 className="text-[14px] font-[500] text-[#111827]">Available</h4>
                            <p className="text-[12px] text-gray-500">Show this item to customers</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${isAvailable ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setIsAvailable(!isAvailable)}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${isAvailable ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl shadow-inner">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto order-3 sm:order-1 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        className="w-full sm:w-auto order-1 sm:order-2 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Save & Add Another
                    </button>
                    <button
                        className="w-full sm:w-auto order-2 sm:order-3 px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        Save Item
                    </button>
                </div>
            </div>
        </div>
    );
}
