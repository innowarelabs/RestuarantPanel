import React from 'react';
import { X, Phone, Mail, MapPin, ChevronRight, ShoppingBag, DollarSign, Award, Target } from 'lucide-react';

export default function CustomerDetailsModal({ isOpen, onClose, customer, customerDetails, loadingDetails }) {
    if (!isOpen || !customer) return null;

    // Skeleton Loader Component
    const SkeletonLoader = () => (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-200 p-5 rounded-[16px] h-24 animate-pulse"></div>
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-200 p-4 rounded-[16px] h-16 animate-pulse"></div>
                ))}
            </div>
        </div>
    );

    // Use real data from API if available, otherwise use customer from table
    const displayData = customerDetails || customer;

    const formatCurrency = (amount) => {
        if (typeof amount === 'number') {
            return `$${amount.toFixed(2)}`;
        }
        return amount;
    };

    const formatAddress = (address) => {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.apt_suite) parts.push(address.apt_suite);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zip_code) parts.push(address.zip_code);
        return parts.join(', ');
    };

    const averageOrderValue = customerDetails ? formatCurrency(customerDetails.average_order_value) : 'N/A';
    const defaultAddress = customerDetails?.delivery_addresses?.find(addr => addr.is_default) || customerDetails?.delivery_addresses?.[0];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[24px] w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-8 flex justify-between items-start">
                    <div className="space-y-3">
                        <h2 className="text-[24px] font-[800] text-[#111827]">{displayData.name || 'Customer'}</h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-gray-500">
                                <Phone size={18} />
                                <span className="text-[14px]">{displayData.phone_number || displayData.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <Mail size={18} />
                                <span className="text-[14px]">{displayData.email || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="pt-1">
                            <span className="px-4 py-1.5 rounded-lg text-[14px] font-medium bg-[#FEF2F2] text-[#DD2F26]">
                                Active
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-gray-100 mx-8"></div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {loadingDetails ? (
                        <SkeletonLoader />
                    ) : (
                        <div className="space-y-8">
                            {/* Customer Profile Summary */}
                            <section>
                                <h3 className="text-[16px] font-[800] text-[#111827] mb-4">Customer Profile Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <ShoppingBag size={16} />
                                            <span className="text-[13px]">Total Orders</span>
                                        </div>
                                        <p className="text-[20px] font-bold text-[#111827]">{displayData.total_orders || 0}</p>
                                    </div>
                                    <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <DollarSign size={16} />
                                            <span className="text-[13px]">Total Spend</span>
                                        </div>
                                        <p className="text-[20px] font-bold text-[#111827]">{formatCurrency(displayData.total_spending || 0)}</p>
                                    </div>
                                    <div className="bg-[#F6F8F9] p-5 rounded-[16px] border border-gray-50">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <Target size={16} />
                                            <span className="text-[13px]">Avg Order Value</span>
                                        </div>
                                        <p className="text-[20px] font-bold text-[#111827]">{averageOrderValue}</p>
                                    </div>
                                    <div className="bg-[#FEF2F2]/30 p-5 rounded-[16px] border border-[#DD2F26]/10">
                                        <div className="flex items-center gap-2 text-[#DD2F26] mb-2">
                                            <Award size={16} />
                                            <span className="text-[13px]">Loyalty Points</span>
                                        </div>
                                        <p className="text-[20px] font-bold text-[#DD2F26]">{displayData.loyalty_points || 0}</p>
                                    </div>
                                </div>

                                {/* Points Info Box */}
                                <div className="mt-4 p-5 rounded-[12px] border border-gray-100">
                                    <p className="text-[14px] text-gray-600">
                                        Lifetime Points Earned: <span className="font-bold text-[#111827]">{displayData.lifetime_loyalty_points_earned || 0}</span>
                                    </p>
                                    {displayData.rewards_available && displayData.rewards_available.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            <p className="text-[14px] text-gray-600">Rewards Available:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {displayData.rewards_available.map((reward, i) => (
                                                    <span key={i} className="px-3 py-1 bg-[#FEF2F2] text-[#DD2F26] rounded-lg text-[13px]">
                                                        {reward}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Delivery Addresses */}
                            {customerDetails?.delivery_addresses && customerDetails.delivery_addresses.length > 0 && (
                                <section>
                                    <h3 className="text-[16px] font-bold text-[#111827] mb-4">Delivery Addresses</h3>
                                    <div className="space-y-3">
                                        {customerDetails.delivery_addresses.map((addr) => (
                                            <div key={addr.id} className={`p-4 rounded-[16px] flex items-start gap-4 border ${addr.is_default ? 'bg-[#FEF2F2] border-[#DD2F26]' : 'bg-[#F9FAFB] border-gray-50'}`}>
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <MapPin size={18} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[15px] font-medium text-[#111827]">{addr.label || 'Address'}</p>
                                                    <p className="text-[14px] text-gray-600">
                                                        {addr.street}
                                                        {addr.apt_suite && ` ${addr.apt_suite}`}
                                                    </p>
                                                    <p className="text-[13px] text-gray-500">
                                                        {addr.city}, {addr.state} {addr.zip_code}
                                                    </p>
                                                    {addr.delivery_instructions && (
                                                        <p className="text-[13px] text-gray-500 mt-2">
                                                            <span className="font-medium">Instructions:</span> {addr.delivery_instructions}
                                                        </p>
                                                    )}
                                                </div>
                                                {addr.is_default && (
                                                    <span className="px-2 py-1 bg-[#DD2F26] text-white rounded text-[12px] font-medium whitespace-nowrap mt-1">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
