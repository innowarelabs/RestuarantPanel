import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import EditStaffModal from './EditStaffModal';
import RemoveStaffModal from './RemoveStaffModal';

const StaffPermissions = () => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const staffMembers = [
        { name: 'Sarah Johnson', email: 'sarah@spicehouse.co.uk', role: 'Manager', status: 'Active' },
        { name: 'Ahmed Khan', email: 'ahmed@spicehouse.co.uk', role: 'Kitchen Staff', status: 'Active' },
        { name: 'Maria Garcia', email: 'maria@spicehouse.co.uk', role: 'Cashier', status: 'Inactive' },
    ];

    const handleAddStaff = () => {
        setSelectedStaff(null);
        setIsEditModalOpen(true);
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        setIsEditModalOpen(true);
    };

    const handleRemoveStaff = (staff) => {
        setSelectedStaff(staff);
        setIsRemoveModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Staff & Permissions</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage team members and their access levels</p>
            </div>

            {/* Staff Members List */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Staff Members</h3>
                    <button
                        onClick={handleAddStaff}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#24B99E] text-white px-4 py-2.5 rounded-[8px] text-[14px] font-[500] hover:bg-[#20a68d] transition shadow-lg shadow-[#24B99E]/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Staff Member
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F7F8FA]">
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Staff Name</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Email Address</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Role</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Status</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {staffMembers.map((staff, index) => (
                                <tr key={index} className="hover:bg-gray-50/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-[500] text-[14px] text-[#1A1A1A]">{staff.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#6B6B6B]">{staff.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#1A1A1A]">{staff.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-xs font-medium ${staff.status === 'Active'
                                            ? 'bg-[#F0FDFA] text-[#24B99E]'
                                            : 'bg-gray-100 text-[#6B6B6B]'
                                            }`}>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <button
                                            onClick={() => handleEditStaff(staff)}
                                            className="p-2 text-[#9CA3AF] hover:text-[#24B99E] transition rounded-lg hover:bg-gray-50"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveStaff(staff)}
                                            className="p-2 text-[#9CA3AF] hover:text-red-500 transition rounded-lg hover:bg-gray-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditStaffModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                staff={selectedStaff}
            />

            <RemoveStaffModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                staffName={selectedStaff?.name}
            />
        </div>
    );
};

export default StaffPermissions;
