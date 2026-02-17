import React from 'react';
import { X } from 'lucide-react';

export default function MenuPreviewModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    // Mock data for preview
    const items = [
        {
            id: 1,
            name: 'Zinger Burger',
            description: 'Spicy crispy chicken burger',
            price: '$12.99',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80'
        },
        {
            id: 2,
            name: 'Classic Beef Burger',
            description: 'Juicy beef patty with lettuce and tomato',
            price: '$10.99',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150&q=80'
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[16px] w-full max-w-[550px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#111827]">Menu Preview</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Customer-facing menu layout</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="p-6">

                        {/* Restaurant Brand */}
                        <div className="text-center mb-8">
                            <h1 className="text-[24px] font-bold text-[#111827] mb-1">FreshBites</h1>
                            <p className="text-[14px] text-gray-500">Delicious food delivered to your door</p>
                        </div>

                        {/* Category Section */}
                        <div className="mb-6">
                            <h2 className="text-[20px] font-bold text-[#111827] mb-2">Burgers</h2>
                            <div className="h-[2px] w-full bg-[#E5E7EB]">
                                <div className="h-full w-[100px] bg-[#2BB29C]"></div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="border border-gray-100 rounded-[12px] p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow transition-colors group cursor-default">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-[80px] h-[80px] rounded-[8px] object-cover"
                                    />
                                    <div className="flex-1 flex justify-between">
                                        <div>
                                            <h3 className="text-[16px] font-medium text-[#111827]">{item.name}</h3>
                                            <p className="text-[13px] text-gray-500 mt-1">{item.description}</p>
                                        </div>
                                        <span className="text-[15px] font-bold text-[#2BB29C]">{item.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-white shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#2BB29C] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#259D89] transition-colors shadow-sm cursor-pointer"
                    >
                        Close Preview
                    </button>
                </div>

            </div>
        </div>
    );
}
