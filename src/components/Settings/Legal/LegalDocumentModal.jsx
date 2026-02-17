import React from 'react';
import { X, Download } from 'lucide-react';

const LegalDocumentModal = ({ isOpen, onClose, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">{title}</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Review the latest version of our {title.toLowerCase()}.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        {title} content here...
                    </p>
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                    <p className="text-[14px] text-[#374151] font-[400] leading-relaxed">
                        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white shadow-inner">
                    <button
                        onClick={() => { }}
                        className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Download PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto order-2 sm:order-1 px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalDocumentModal;
