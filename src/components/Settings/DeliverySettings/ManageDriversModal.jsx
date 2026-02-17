import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

const ManageDriversModal = ({ isOpen, onClose }) => {
    const [drivers] = useState([
        { id: 1, name: 'Ahmed Khan', phone: '+44 7700 900123', status: 'Active' },
        { id: 2, name: 'Sarah Ali', phone: '+44 7700 900456', status: 'Active' },
        { id: 3, name: 'Mohammed Shah', phone: '+44 7700 900789', status: 'Inactive' },
    ]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[16px] w-full max-w-[500px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#F3F4F6] flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-[20px] font-[800] text-[#111827]">Manage Drivers</h2>
                        <p className="text-[13px] text-gray-500">Add and manage your delivery drivers</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Container - Scrollable */}
                <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Driver List Table */}
                    <div className="border border-[#E8E8E8] rounded-[10px] overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-[#E8E8E8]">
                                    <th className="px-4 py-3 text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-wider text-nowrap">Name</th>
                                    <th className="px-4 py-3 text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-wider text-nowrap">Phone</th>
                                    <th className="px-4 py-3 text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-wider text-nowrap">Status</th>
                                    <th className="px-4 py-3 text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-wider text-right text-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6]">
                                {drivers.map((driver) => (
                                    <tr key={driver.id} className="text-[13px] hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-[500] text-[#111827] text-nowrap">{driver.name}</td>
                                        <td className="px-4 py-3 text-[#6B7280] text-nowrap">{driver.phone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-[600] text-nowrap ${driver.status === 'Active'
                                                ? 'bg-[#E6F8F5] text-[#2BB29C]'
                                                : 'bg-[#F3F4F6] text-[#6B7280]'
                                                }`}>
                                                {driver.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="p-1.5 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add New Driver Section */}
                    <div className="bg-[#F9FAFB] rounded-[12px] p-4 space-y-3 border border-[#E8E8E8]">
                        <h3 className="text-[15px] font-[700] text-[#111827]">Add New Driver</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[13px] font-[500] text-[#111827] mb-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="Driver name"
                                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#2BB29C] transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[13px] font-[500] text-[#111827] mb-1">Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+44 77..."
                                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#2BB29C] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-[500] text-[#111827] mb-1">Status</label>
                                    <div className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] h-[38px] flex items-center text-[13px] text-gray-400">
                                        Active
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-[13px] font-[600] text-[#111827] hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 bg-[#2BB29C] text-white rounded-[6px] text-[13px] font-[600] hover:bg-[#24A18C] transition-all shadow-lg shadow-[#2BB29C]/10 active:scale-[0.98]"
                                >
                                    Add Driver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageDriversModal;
