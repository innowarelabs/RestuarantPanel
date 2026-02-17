import React, { useState } from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import LegalDocumentModal from './LegalDocumentModal';
import ConfirmLegalRequestModal from './ConfirmLegalRequestModal';

const LegalSettings = () => {
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [requestType, setRequestType] = useState('deletion');

    const documents = [
        'Terms & Conditions',
        'Privacy Policy',
        'Data Processing Agreement',
        'Refund Policy',
    ];

    const handleViewDoc = (doc) => {
        setSelectedDoc(doc);
        setIsDocumentModalOpen(true);
    };

    const handleRequest = (type) => {
        setRequestType(type);
        setIsRequestModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Legal</h2>
                <p className="text-[#6B6B6B] text-[14px]">View legal documents and manage your data</p>
            </div>

            {/* Legal Documents */}
            <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-5 space-y-4">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Legal Documents</h3>
                <div className="space-y-3">
                    {documents.map((doc, index) => (
                        <div
                            key={index}
                            onClick={() => handleViewDoc(doc)}
                            className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[8px] hover:border-[#24B99E]/30 transition group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[#F0FDFA] transition-colors">
                                    <FileText className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#24B99E] transition" />
                                </div>
                                <span className="font-[500] text-[14px] text-[#1A1A1A]">{doc}</span>
                            </div>
                            <button className="px-4 py-1 border border-[#E5E7EB] rounded-[8px] text-[13px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm">
                                View
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Account Data */}
            <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-5 space-y-4">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Account Data</h3>
                <p className="text-[14px] text-[#6B6B6B]">Request a copy of your data or permanently delete your account information</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                        onClick={() => handleRequest('export')}
                        className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 border border-[#E5E7EB] rounded-[12px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Request Data Export
                    </button>
                    <button
                        onClick={() => handleRequest('deletion')}
                        className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 border border-[#FECACA] text-[#EF4444] rounded-[12px] text-[14px] font-[500] hover:bg-[#FEF2F2] transition shadow-sm active:scale-95 text-center"
                    >
                        <Trash2 className="w-4 h-4" />
                        Request Data Deletion
                    </button>
                </div>
            </div>

            <LegalDocumentModal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                title={selectedDoc}
            />

            <ConfirmLegalRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                type={requestType}
            />
        </div>
    );
};

export default LegalSettings;
