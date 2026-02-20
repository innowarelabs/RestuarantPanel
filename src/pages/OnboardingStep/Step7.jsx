import { ChevronLeft, ChevronRight } from 'lucide-react';

import NotificationToggle from './NotificationToggle';

export default function Step7({ formData, setFormData, handlePrev, handleNext }) {
    const enabledChannels = [formData.appNotify, formData.emailNotify, formData.smsNotify].filter(Boolean).length;

    return (
        <div className="space-y-10">
            <div className="space-y-6">
                <h3 className="text-[15px] font-[400] text-[#111827]">General Notifications</h3>
                <div className="space-y-6">
                    <NotificationToggle
                        title="App Notifications"
                        desc="Receive push notifications in the app"
                        active={formData.appNotify}
                        onClick={() => setFormData({ ...formData, appNotify: !formData.appNotify })}
                    />
                    <NotificationToggle
                        title="Email Notifications"
                        desc="Receive notifications via email"
                        active={formData.emailNotify}
                        onClick={() => setFormData({ ...formData, emailNotify: !formData.emailNotify })}
                    />
                    <NotificationToggle
                        title="SMS Notifications"
                        desc="Receive text messages for critical updates"
                        active={formData.smsNotify}
                        onClick={() => setFormData({ ...formData, smsNotify: !formData.smsNotify })}
                    />
                </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-6">
                <h3 className="text-[16px] font-[500] text-[#111827]">Alert Preferences</h3>
                <div className="space-y-6">
                    <NotificationToggle
                        title="New Order Alert"
                        desc="Get notified when a new order is placed"
                        active={formData.newOrderAlert}
                        onClick={() => setFormData({ ...formData, newOrderAlert: !formData.newOrderAlert })}
                    />
                    <NotificationToggle
                        title="Rider Assigned Alert"
                        desc="Get notified when a delivery rider is assigned"
                        active={formData.riderAlert}
                        onClick={() => setFormData({ ...formData, riderAlert: !formData.riderAlert })}
                    />
                    <NotificationToggle
                        title="Complaint Received Alert"
                        desc="Get notified about customer complaints"
                        active={formData.complaintAlert}
                        onClick={() => setFormData({ ...formData, complaintAlert: !formData.complaintAlert })}
                    />
                </div>
            </div>

            <div className="bg-[#E6F7F4] p-5 rounded-[8px] mt-2">
                <p className="text-[13px] text-[#475569]">
                    You have {enabledChannels} notification {enabledChannels === 1 ? 'channel' : 'channels'} enabled
                </p>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
