import React, { useState } from 'react';
import { X } from 'lucide-react';

const getInitialFormData = (staff) => {
    if (staff) {
        return {
            name: staff.name || '',
            email: staff.email || '',
            role: staff.role || '',
            status: staff.status === 'Active',
            permissions: {
                manageOrders: true,
                manageMenu: false,
                manageDrivers: false,
                viewReports: false,
                editSettings: false,
                issueRefunds: false,
            },
        };
    }

    return {
        name: '',
        email: '',
        role: '',
        status: true,
        permissions: {
            manageOrders: false,
            manageMenu: false,
            manageDrivers: false,
            viewReports: false,
            editSettings: false,
            issueRefunds: false,
        },
    };
};

const EditStaffModalInner = ({ onClose, staff }) => {
    const [formData, setFormData] = useState(() => getInitialFormData(staff));

    const permissionsList = [
        { id: 'manageOrders', label: 'Manage Orders' },
        { id: 'manageMenu', label: 'Manage Menu' },
        { id: 'manageDrivers', label: 'Manage Drivers' },
        { id: 'viewReports', label: 'View Reports' },
        { id: 'editSettings', label: 'Edit Settings' },
        { id: 'issueRefunds', label: 'Issue Refunds' },
    ];

    const handlePermissionChange = (id) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [id]: !prev.permissions[id]
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">{staff ? 'Edit' : 'Add'} Staff Member</h2>
                        <p className="text-[13px] text-gray-500 mt-1">Manage permissions and details for this staff member.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[13px] font-semibold text-[#1A1A1A]">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Sarah Johnson"
                                className="w-full px-4 py-2.5 bg-white border border-[#E8E8E8] rounded-[8px] text-[14px] font-[500] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1A1A1A]">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="sarah@spicehouse.co.uk"
                                className="w-full px-4 py-2.5 bg-white border border-[#E8E8E8] rounded-[8px] text-[14px] font-[500] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1A1A1A]">Role</label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                placeholder="e.g. Manager"
                                className="w-full px-4 py-2.5 bg-white border border-[#E8E8E8] rounded-[8px] text-[14px] font-[500] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition-all"
                            />
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-semibold text-[#1A1A1A]">Permissions</label>
                        <div className="bg-gray-50/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {permissionsList.map((item) => (
                                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => handlePermissionChange(item.id)}
                                        className={`w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0 ${formData.permissions[item.id]
                                            ? 'bg-[#24B99E] border-[#24B99E]'
                                            : 'border-[#D1D5DB] group-hover:border-[#24B99E]'
                                            }`}
                                    >
                                        {formData.permissions[item.id] && (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[13px] font-[500] text-[#4B5563] truncate">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between py-3 px-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                        <div>
                            <p className="font-[600] text-[14px] text-[#134E4A]">Active Status</p>
                            <p className="text-[12px] text-[#115E59]">Manage system access</p>
                        </div>
                        <button
                            onClick={() => setFormData({ ...formData, status: !formData.status })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status ? 'bg-[#24B99E]' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white shadow-inner">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[16px] font-[400] text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[16px] font-[400] text-white bg-[#2BB29C] rounded-[8px] shadow-lg shadow-[#2BB29C]/20 hover:bg-[#24A18C] active:scale-95 transition-all"
                    >
                        {staff ? 'Save Changes' : 'Add Staff'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditStaffModal = ({ isOpen, onClose, staff }) => {
    if (!isOpen) return null;

    const modalKey = staff
        ? `${staff.email || ''}-${staff.name || ''}-${staff.role || ''}`
        : 'new';

    return <EditStaffModalInner key={modalKey} onClose={onClose} staff={staff} />;
};

export default EditStaffModal;
