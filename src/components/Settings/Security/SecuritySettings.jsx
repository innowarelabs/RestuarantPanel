import React, { useState } from 'react';
import { Lock, Laptop, Smartphone, Monitor, ShieldCheck, Mail, MessageSquare, Smartphone as MobileIcon } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import Setup2FAModal from './Setup2FAModal';

const SecuritySettings = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [selected2FAMethod, setSelected2FAMethod] = useState(null);

    const devices = [
        { name: 'Chrome on MacBook Pro', browser: 'Chrome 120', lastActive: '2 mins ago', location: 'London, UK', icon: Laptop },
        { name: 'Safari on iPhone', browser: 'Safari 17', lastActive: '1 hour ago', location: 'London, UK', icon: Smartphone },
        { name: 'Firefox on Windows', browser: 'Firefox 121', lastActive: '2 days ago', location: 'Manchester, UK', icon: Monitor },
    ];

    const handle2FAMethodSelect = (method) => {
        setSelected2FAMethod(method);
        setIs2FAModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Security</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage your account security settings</p>
            </div>

            {/* Password Management */}
            <div className="bg-white rounded-[16px] border border-[#00000033] p-5 space-y-4">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Password Management</h3>
                <p className="text-[14px] text-[#6B6B6B]">Update your password regularly to keep your account secure</p>
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 border border-[#D1D5DB] rounded-[12px] text-[14px] font-[500] text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm active:scale-95"
                >
                    <Lock className="w-4 h-4" />
                    Change Password
                </button>
            </div>

            {/* 2FA Section - Updated UI from Images */}
            <div className="bg-white rounded-[16px] border border-[#00000033] p-5 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Two-Factor Authentication (2FA)</h3>
                        <div className="mt-4">
                            <p className="font-[500] text-[#1A1A1A] text-[14px]">Enable 2FA</p>
                            <p className="text-[13px] text-[#9CA3AF]">Add an extra layer of security to your account</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${is2FAEnabled ? 'bg-[#24B99E]' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${is2FAEnabled ? 'translate-x-[1.75rem]' : 'translate-x-[0.25rem]'} shadow-sm`} />
                    </button>
                </div>

                <div className="border-t border-[#F3F4F6] pt-8">
                    <p className="text-[14px] font-[500] text-[#1A1A1A] mb-4">Choose Authentication Method:</p>
                    <div className="space-y-3">
                        <div
                            onClick={() => handle2FAMethodSelect('SMS')}
                            className="flex items-center gap-4 p-5 border border-[#00000033] rounded-[12px] hover:border-[#24B99E]/30 cursor-pointer transition group"
                        >
                            <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#F0FDFA]">
                                <MessageSquare className="w-5 h-5 text-[#24B99E]" />
                            </div>
                            <div>
                                <p className="font-[500] text-[14px] text-[#1A1A1A]">SMS</p>
                                <p className="text-[13px] text-[#9CA3AF]">Receive codes via text message</p>
                            </div>
                        </div>

                        <div
                            onClick={() => handle2FAMethodSelect('Email')}
                            className="flex items-center gap-4 p-5 border border-[#00000033] rounded-[12px] hover:border-[#24B99E]/30 cursor-pointer transition group"
                        >
                            <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#F0FDFA]">
                                <Mail className="w-5 h-5 text-[#24B99E]" />
                            </div>
                            <div>
                                <p className="font-[500] text-[14px] text-[#1A1A1A]">Email</p>
                                <p className="text-[13px] text-[#9CA3AF]">Receive codes via email</p>
                            </div>
                        </div>

                        <div
                            onClick={() => handle2FAMethodSelect('Authenticator App')}
                            className="flex items-center gap-4 p-5 border border-[#00000033] rounded-[12px] hover:border-[#24B99E]/30 cursor-pointer transition group"
                        >
                            <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#F0FDFA]">
                                <MobileIcon className="w-5 h-5 text-[#24B99E]" />
                            </div>
                            <div>
                                <p className="font-[500] text-[14px] text-[#1A1A1A]">Authenticator App</p>
                                <p className="text-[13px] text-[#9CA3AF]">Use Google Authenticator or similar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Management */}
            <div className="bg-white rounded-[16px] border border-[#00000033] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-[18px] font-[800] text-[#1A1A1A]">Device Management</h3>
                    <button className="w-full sm:w-auto px-6 py-2.5 border border-[#E02424] text-[#EF4444] rounded-[8px] text-[13px] font-[500] hover:bg-[#FEF2F2] transition shadow-sm text-center active:scale-95">
                        Log Out From All Devices
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F7F8FA]">
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Device Name</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Browser</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Last Active</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-nowrap">Location</th>
                                <th className="px-6 py-4 text-[13px] font-[600] text-[#4B5563] tracking-wider text-right text-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {devices.map((device, index) => (
                                <tr key={index} className="hover:bg-gray-50/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <device.icon className="w-4 h-4 text-[#9CA3AF]" />
                                            <span className="font-[400] text-[14px] text-[#1A1A1A]">{device.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400]">{device.browser}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400]">{device.lastActive}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[#6B6B6B] text-[14px] font-[400]">{device.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-[13px] font-[400] text-[#EF4444] hover:underline">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <Setup2FAModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                method={selected2FAMethod}
            />
        </div>
    );
};

export default SecuritySettings;
