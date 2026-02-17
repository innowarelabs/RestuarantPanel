import React from 'react';
import { Mail, MessageCircle, Phone, Bell, Save } from 'lucide-react';

const NotificationsSettings = () => {
    const channels = [
        { name: 'Email Notifications', description: 'Receive alerts via email', icon: Mail, enabled: true },
        { name: 'SMS Notifications', description: 'Receive text message alerts', icon: MessageCircle, enabled: true },
        { name: 'WhatsApp Notifications', description: 'Receive notifications on WhatsApp', icon: Phone, enabled: false },
        { name: 'In-App Notifications', description: 'Show alerts within the dashboard', icon: Bell, enabled: true },
    ];

    const events = [
        { name: 'New Order Received', email: true, sms: true, inApp: true },
        { name: 'Order Cancelled', email: true, sms: false, inApp: true },
        { name: 'Refund Requested', email: true, sms: true, inApp: true },
        { name: 'Rider Assigned', email: false, sms: true, inApp: true },
        { name: 'Support Ticket Received', email: true, sms: false, inApp: true },
        { name: 'Payout Completed', email: true, sms: true, inApp: false },
        { name: 'Integration Error', email: true, sms: false, inApp: true },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Notifications</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage notifications and their access levels</p>
            </div>

            {/* Notification Channels */}
            <div className="bg-white rounded-[12px] border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-4">Notification Channels</h3>
                <div className="space-y-4">
                    {channels.map((channel, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                                    <channel.icon className="w-5 h-5 text-[#9CA3AF]" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-[500] text-[#1A1A1A]">{channel.name}</p>
                                    <p className="text-[13px] text-[#9CA3AF]">{channel.description}</p>
                                </div>
                            </div>
                            <button
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${channel.enabled ? 'bg-[#24B99E]' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${channel.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notification Events */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB]">
                    <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Notification Events</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {events.map((event, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[500] text-[#1A1A1A]">{event.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button className={`mx-auto relative inline-flex h-5 w-9 items-center rounded-full ${event.email ? 'bg-[#24B99E]' : 'bg-gray-100'}`}>
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${event.email ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button className={`mx-auto relative inline-flex h-5 w-9 items-center rounded-full ${event.sms ? 'bg-[#24B99E]' : 'bg-gray-100'}`}>
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${event.sms ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button className={`mx-auto relative inline-flex h-5 w-9 items-center rounded-full ${event.inApp ? 'bg-[#24B99E]' : 'bg-gray-100'}`}>
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${event.inApp ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-5 bg-gray-50/50 border-t border-[#E5E7EB] flex justify-end">
                    <button className="flex items-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#20a68d] transition">
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsSettings;
