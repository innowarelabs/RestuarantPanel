import React from 'react';
import toast from 'react-hot-toast';

export default function OrderToast({ t, orderId, onViewOrder }) {
    return (
        <div className={`${t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'} pointer-events-auto w-[calc(100vw-32px)] sm:w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden`}>
            <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                    <h4 className="text-[14px] sm:text-[16px] font-bold text-[#1A1A1A]">
                        New Order Received! Order #{orderId}
                    </h4>
                    <p className="text-[#6B6B6B] text-[12px] sm:text-[14px] mt-0.5 sm:mt-1 font-medium">
                        Click to view details
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            onViewOrder();
                            toast.dismiss(t.id);
                        }}
                        className="flex-1 sm:flex-none h-[38px] sm:h-[44px] px-4 sm:px-6 bg-[#24B99E] text-white text-[13px] sm:text-[14px] font-bold rounded-xl hover:bg-[#20a38b] transition-all shadow-lg shadow-[#24B99E]/20"
                    >
                        View Order
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 sm:flex-none h-[38px] sm:h-[44px] px-4 sm:px-6 border border-[#E5E7EB] text-[#6B6B6B] text-[13px] sm:text-[14px] font-bold rounded-xl hover:bg-gray-50 transition-all font-inter"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
