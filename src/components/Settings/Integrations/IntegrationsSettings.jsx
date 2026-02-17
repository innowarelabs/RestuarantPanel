import React, { useState } from 'react';
import { Zap, RefreshCcw } from 'lucide-react';
import DisconnectIntegrationModal from './DisconnectIntegrationModal';
import ConnectIntegrationModal from './ConnectIntegrationModal';
import IntegrationDetailsModal from './IntegrationDetailsModal';

const IntegrationsSettings = () => {
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);

    const integrations = [
        { name: 'UberEats', status: 'Connected', lastSync: '2 mins ago', totalOrders: 385, iconColor: 'text-[#1A1A1A]' },
        { name: 'Deliveroo', status: 'Connected', lastSync: '5 mins ago', totalOrders: 242, iconColor: 'text-[#00CCBC]' },
        { name: 'JustEat', status: 'Not Connected', iconColor: 'text-[#F36D00]' },
        { name: 'GHL', status: 'Not Connected', iconColor: 'text-[#2A5BD7]' },
    ];

    const handleConnect = (platform) => {
        setSelectedPlatform(platform);
        setIsConnectModalOpen(true);
    };

    const handleDisconnect = (platform) => {
        setSelectedPlatform(platform);
        setIsDisconnectModalOpen(true);
    };

    const handleViewDetails = (platform) => {
        setSelectedPlatform(platform);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Integrations</h2>
                <p className="text-[#6B6B6B] text-[14px]">Connect third-party delivery platforms</p>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((item, index) => (
                    <div key={index} className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 space-y-6  ">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-[12px] flex items-center justify-center border border-[#E5E7EB] transition-transform hover:scale-105">
                                    <Zap className={`w-9 h-9 ${item.status === 'Connected' ? 'text-[#24B99E]' : 'text-[#9CA3AF]'}`} />
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold text-[#1A1A1A]">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${item.status === 'Connected' ? 'bg-[#24B99E]' : 'bg-gray-300'}`}></div>
                                        <span className={`text-[12px] bg-[#E6F7F4] px-2 py-1 rounded-[6px] font-medium ${item.status === 'Connected' ? 'text-[#24B99E]' : 'text-[#6B6B6B]'}`}>
                                            {item.status === 'Connected' ? '✓ Connected' : '○ Not Connected'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {item.status === 'Connected' ? (
                            <>
                                <div className="bg-[#F7F8FA] rounded-[8px] p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[13px] text-[#9CA3AF] uppercase font-[400] tracking-wider">Last Sync:</p>
                                        <p className="text-[13px] font-[400] text-[#6B7280] mt-1">{item.lastSync}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] text-[#9CA3AF] uppercase font-[400] tracking-wider">Total Orders:</p>
                                        <p className="text-[13px] font-[400] text-[#6B7280] mt-1">{item.totalOrders}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDisconnect(item)}
                                        className="flex-1 py-2 border border-[#E02424] text-[#EF4444] rounded-[8px] font-[500] text-[13px] hover:bg-[#FEF2F2] transition"
                                    >
                                        Disconnect
                                    </button>
                                    <button
                                        onClick={() => handleViewDetails(item)}
                                        className="flex-1 py-2 border border-[#E5E7EB] text-[#1A1A1A] rounded-[8px] font-[500] text-[13px] hover:bg-gray-50 transition "
                                    >
                                        View Details
                                    </button>
                                    <button className="p-2 border border-[#E5E7EB] text-[#1A1A1A] rounded-[8px] hover:bg-gray-50 transition ">
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => handleConnect(item)}
                                className="w-full py-3 bg-[#24B99E] text-white rounded-[8px] text-[14px] font-[500] hover:bg-[#20a68d] transition shadow-lg shadow-[#24B99E]/20"
                            >
                                Connect
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <DisconnectIntegrationModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                platformName={selectedPlatform?.name}
            />

            <ConnectIntegrationModal
                isOpen={isConnectModalOpen}
                onClose={() => setIsConnectModalOpen(false)}
                platformName={selectedPlatform?.name}
            />

            <IntegrationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                platform={selectedPlatform}
            />
        </div>
    );
};

export default IntegrationsSettings;
