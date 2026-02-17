import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
                <p className="text-[14px] text-gray-500">
                    Showing <span className="font-medium text-[#111827]">1</span> to <span className="font-medium text-[#111827]">10</span> of <span className="font-medium text-[#111827]">20</span> results
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={18} className="text-gray-600" />
                </button>

                <div className="flex items-center gap-1">
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-[14px] font-medium transition-colors
                                ${currentPage === page
                                    ? 'bg-[#2BB29C] text-white'
                                    : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={18} className="text-gray-600" />
                </button>
            </div>
        </div>
    );
}
