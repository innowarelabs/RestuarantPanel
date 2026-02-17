import React, { useState } from 'react';
import { Pause, XCircle, AlertTriangle } from 'lucide-react';
import PauseRestaurantModal from './PauseRestaurantModal';
import DeactivateAccountModal from './DeactivateAccountModal';
import DeleteAccountModal from './DeleteAccountModal';

const DangerZoneSettings = () => {
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Danger Zone</h2>
                <p className="text-[#6B6B6B] text-[14px]">Critical actions that affect your restaurant account</p>
            </div>

            {/* Main Container */}
            <div className="bg-[#FFF8F8] rounded-[12px] border border-[#E02424] overflow-hidden ">
                {/* Pause Restaurant */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                <Pause className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Pause Restaurant</h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px]">Temporarily disable ordering for customers.</p>
                    </div>
                    <button
                        onClick={() => setIsPauseModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#F59E0B] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#D97706] transition-all shadow-lg shadow-orange-100 active:scale-95 text-center"
                    >
                        Pause Restaurant
                    </button>
                </div>

                <div className="mx-8 border-t border-[#F3F4F6]"></div>

                {/* Deactivate Account */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                <XCircle className="w-5 h-5 text-[#F97316]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Deactivate Account</h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px]">Deactivate your restaurant's access to the system temporarily.</p>
                    </div>
                    <button
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#F97316] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-100 active:scale-95 text-center"
                    >
                        Deactivate Account
                    </button>
                </div>

                <div className="mx-8 border-t border-[#F3F4F6]"></div>

                {/* Delete Account */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                            </div>
                            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Delete Account Permanently</h3>
                        </div>
                        <p className="text-[#6B6B6B] text-[14px]">This action cannot be undone. All restaurant data will be permanently deleted.</p>
                    </div>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#EF4444] text-white rounded-[8px] text-[13px] font-[500] hover:bg-[#DC2626] transition-all shadow-lg shadow-red-100 active:scale-95 text-center"
                    >
                        Delete Restaurant
                    </button>
                </div>
            </div>

            <PauseRestaurantModal
                isOpen={isPauseModalOpen}
                onClose={() => setIsPauseModalOpen(false)}
            />

            <DeactivateAccountModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default DangerZoneSettings;
