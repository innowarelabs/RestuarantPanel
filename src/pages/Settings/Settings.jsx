import React, { useState } from 'react';
import BusinessProfile from '../../components/Settings/BusinessProfile/BusinessProfile';
import OperatingHours from '../../components/Settings/OperatingHours/OperatingHours';
import OrderSettings from '../../components/Settings/OrderSettings/OrderSettings';
import DeliverySettings from '../../components/Settings/DeliverySettings/DeliverySettings';
import StaffPermissions from '../../components/Settings/StaffPermissions/StaffPermissions';
import NotificationsSettings from '../../components/Settings/Notifications/NotificationsSettings';
import IntegrationsSettings from '../../components/Settings/Integrations/IntegrationsSettings';
import LoyaltyPreferences from '../../components/Settings/LoyaltyPreferences/LoyaltyPreferences';
import SecuritySettings from '../../components/Settings/Security/SecuritySettings';
import LegalSettings from '../../components/Settings/Legal/LegalSettings';
import DangerZoneSettings from '../../components/Settings/DangerZone/DangerZoneSettings';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('Business Profile');

    const tabs = [
        'Business Profile',
        'Operating Hours',
        'Order Settings',
        'Delivery Settings',
        'Staff & Permissions',
        'Notifications',
        'Integrations',
        'Loyalty Preferences',
        'Security',
        'Legal',
        'Danger Zone',
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Business Profile':
                return <BusinessProfile />;
            case 'Operating Hours':
                return <OperatingHours />;
            case 'Order Settings':
                return <OrderSettings />;
            case 'Delivery Settings':
                return <DeliverySettings />;
            case 'Staff & Permissions':
                return <StaffPermissions />;
            case 'Notifications':
                return <NotificationsSettings />;
            case 'Integrations':
                return <IntegrationsSettings />;
            case 'Loyalty Preferences':
                return <LoyaltyPreferences />;
            case 'Security':
                return <SecuritySettings />;
            case 'Legal':
                return <LegalSettings />;
            case 'Danger Zone':
                return <DangerZoneSettings />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
                        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{activeTab}</h3>
                        <p className="text-[#6B6B6B]">This settings section is coming soon.</p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20">
            {/* Tabs Navigation */}
            <div className="mb-8 overflow-x-auto no-scrollbar bg-[#FFFFFF] p-2 rounded-[12px]">
                <div className="flex border-b border-[#E5E7EB] min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-4 text-[14px] font-medium transition-all relative ${activeTab === tab
                                ? tab === 'Danger Zone' ? 'text-red-500' : 'text-[#24B99E]'
                                : tab === 'Danger Zone' ? 'text-red-400 opacity-80 hover:opacity-100' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab === 'Danger Zone' ? 'bg-red-500' : 'bg-[#24B99E]'}`} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-500">
                {renderContent()}
            </div>
        </div>
    );
};

export default Settings;
