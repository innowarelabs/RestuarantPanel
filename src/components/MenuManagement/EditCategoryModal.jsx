import React, { useState } from 'react';
import { X } from 'lucide-react';

const getInitialFormData = (category) => {
    if (category) {
        return {
            name: category.name || '',
            isVisible: category.visible !== false,
        };
    }

    return {
        name: '',
        isVisible: true,
    };
};

function EditCategoryModalInner({ onClose, category }) {
    const [formData, setFormData] = useState(() => getInitialFormData(category));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[16px] w-full max-w-[500px] shadow-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[18px] font-bold text-[#111827]">Edit Category</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 bg-white">

                    {/* Category Name */}
                    <div>
                        <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Category Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#2BB29C] transition-colors placeholder-gray-400"
                        />
                    </div>

                    {/* Category Visibility */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-[14px] font-medium text-[#374151]">Category Visibility</h4>
                            <p className="text-[12px] text-gray-500">Show this category to customers</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 cursor-pointer transition-colors ${formData.isVisible ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}
                            onClick={() => setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }))}
                        >
                            <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${formData.isVisible ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button className="px-5 py-2.5 bg-[#2BB29C] rounded-[8px] text-[14px] font-medium text-white hover:bg-[#259D89] transition-colors">
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}

export default function EditCategoryModal({ isOpen, onClose, category }) {
    if (!isOpen) return null;

    const modalKey = category ? `${category.name || ''}-${category.visible || ''}` : 'new';

    return <EditCategoryModalInner key={modalKey} onClose={onClose} category={category} />;
}
