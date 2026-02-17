import React, { useState } from 'react';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';
import AddSpecialDayModal from './AddSpecialDayModal';

const OperatingHours = () => {
    const [isAddSpecialDayModalOpen, setIsAddSpecialDayModalOpen] = useState(false);

    const days = [
        { name: 'Monday', isOpen: true, hours: ['09:00', '22:00'], hasBreak: false },
        { name: 'Tuesday', isOpen: true, hours: ['09:00', '22:00'], hasBreak: false },
        { name: 'Wednesday', isOpen: true, hours: ['09:00', '22:00'], hasBreak: false },
        { name: 'Thursday', isOpen: true, hours: ['09:00', '22:00'], hasBreak: false },
        { name: 'Friday', isOpen: true, hours: ['09:00', '22:00'], hasBreak: false },
        { name: 'Saturday', isOpen: true, hours: ['10:00', '23:00'], hasBreak: false },
        { name: 'Sunday', isOpen: true, hours: ['10:00', '21:00'], hasBreak: false },
    ];

    const specialDays = [
        { date: '25 Dec 2025', status: 'Closed', color: 'text-red-500' },
        { date: '1 Jan 2026', hours: '12:00 - 18:00', color: 'text-[#6B6B6B]' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Operating Hours</h2>
                <p className="text-[#6B6B6B] text-[14px]">Set your restaurant's opening hours and special days</p>
            </div>

            {/* Weekly Hours */}
            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-2">Weekly Hours</h3>
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <div className="min-w-[600px] space-y-0">
                        {days.map((day) => (
                            <div key={day.name} className="flex items-center py-4 border-b border-[#F3F4F6] last:border-0 gap-4">
                                <div className="w-32 flex-shrink-0">
                                    <span className="font-[500] text-[14px] text-[#1A1A1A]">{day.name}</span>
                                </div>
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${day.isOpen ? 'bg-[#24B99E]' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${day.isOpen ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>

                                    {day.isOpen ? (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <input
                                                type="text"
                                                defaultValue={day.hours[0]}
                                                className="w-20 sm:w-24 px-2 py-1 border border-[#E8E8E8] rounded-[8px] text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                                            />
                                            <span className="text-[#9CA3AF]">-</span>
                                            <input
                                                type="text"
                                                defaultValue={day.hours[1]}
                                                className="w-20 sm:w-24 px-3 py-1 border border-[#E8E8E8] rounded-[8px] text-[14px] text-center focus:outline-none focus:ring-1 focus:ring-[#24B99E]"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-[#9CA3AF] flex-shrink-0">Closed</span>
                                    )}

                                    <div className="flex items-center gap-4 ml-auto">
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-gray-200`}
                                            >
                                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                                            </button>
                                            <span className="text-[14px] text-[#9CA3AF] whitespace-nowrap">No break</span>
                                        </div>
                                        {/* Dummy inputs for break if active */}
                                        <div className="flex items-center gap-2 pointer-events-none">
                                            <input type="text" className="w-20 sm:w-24 px-3 py-1.5 border border-[#E8E8E8] rounded-[8px] text-sm bg-gray-50" />
                                            <span className="text-[#9CA3AF]">-</span>
                                            <input type="text" className="w-20 sm:w-24 px-3 py-1.5 border border-[#E8E8E8] rounded-[8px] text-sm bg-gray-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="flex items-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#20a68d] transition">
                        <Save className="w-4 h-4" />
                        Save Hours
                    </button>
                </div>
            </div>

            {/* Special Days */}
            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Special Days</h3>
                    <button
                        onClick={() => setIsAddSpecialDayModalOpen(true)}
                        className="flex items-center gap-2 bg-[#24B99E] text-white px-4 py-2 rounded-[8px] text-[14px] font-[500] hover:bg-[#20a68d] transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Special Day
                    </button>
                </div>
                <div className="space-y-3">
                    {specialDays.map((special, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl">
                            <div>
                                <p className="font-[500] text-[14px] text-[#1A1A1A]">{special.date}</p>
                                <p className={`text-[13px] ${special.color}`}>{special.status || special.hours}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-[#9CA3AF] hover:text-[#24B99E] transition rounded-lg hover:bg-gray-50">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-[#9CA3AF] hover:text-red-500 transition rounded-lg hover:bg-gray-50">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddSpecialDayModal
                isOpen={isAddSpecialDayModalOpen}
                onClose={() => setIsAddSpecialDayModalOpen(false)}
            />
        </div>
    );
};

export default OperatingHours;
