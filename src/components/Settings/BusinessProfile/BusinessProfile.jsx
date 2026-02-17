import React from 'react';
import { Upload, MapPin, Save } from 'lucide-react';

const BusinessProfile = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[28px] font-bold text-[#1A1A1A]">Business Profile</h2>
                <p className="text-[#6B6B6B] text-[14px]">Manage your restaurant information and branding</p>
            </div>

            {/* Restaurant Identity */}
            <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
                <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">Restaurant Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Restaurant Name</label>
                            <input
                                type="text"
                                defaultValue="The Spice House"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Category</label>
                            <input
                                type="text"
                                placeholder="e.g. Indian, Italian"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Support Email</label>
                            <input
                                type="email"
                                defaultValue="support@spicehouse.co.uk"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Business Phone</label>
                            <input
                                type="text"
                                defaultValue="+44 20 7946 0958"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Restaurant Logo</label>
                            <div className="border border-[#E8E8E8] rounded-[12px] h-[162px] p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50/50">
                                <div className="w-12 h-12 bg-white  flex items-center justify-center ">
                                    <Upload className="w-6 h-6 text-[#9CA3AF]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[14px] text-[#4B5563]">Square logo, 500x500px</p>
                                </div>
                                <button className="px-4 py-1 text-[14px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition">
                                    Replace Logo
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Cover Photo</label>
                            <div className="border border-[#E8E8E8] h-[135px] rounded-[12px] p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50/50">
                                <div className="w-12 h-12 bg-white  flex items-center justify-center ">
                                    <Upload className="w-6 h-6 text-[#9CA3AF]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[14px] text-[#4B5563]">Banner 1200x400px</p>
                                </div>
                                <button className="px-4 py-1 text-[14px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition">
                                    Replace Cover
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end px-0">
                    <button className="flex items-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px] font-[500] hover:bg-[#20a68d] transition">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Business Address */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="text-[18px] font-[800] text-[#1A1A1A] mb-6">Business Address</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Street Address</label>
                        <input
                            type="text"
                            defaultValue="124 High Street"
                            className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">City</label>
                            <input
                                type="text"
                                defaultValue="London"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Postal Code</label>
                            <input
                                type="text"
                                defaultValue="SW1A 1AA"
                                className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[14px] font-medium text-[#4B5563] mb-1">Country</label>
                        <input
                            type="text"
                            placeholder="e.g. United Kingdom"
                            className="w-full px-4 py-2 bg-white text-[14px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B99E]/20 focus:border-[#24B99E] transition"
                        />
                    </div>

                    <div className="mt-6 border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="bg-gray-50 h-48 flex flex-col items-center justify-center space-y-4">
                            <MapPin className="w-8 h-8 text-[#9CA3AF]" />
                            <p className="text-[14px] text-[#6B6B6B]">Map preview</p>
                            <button className="px-6 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-medium text-[#1A1A1A] shadow-sm hover:bg-gray-50 transition">
                                Set Location on Map
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="flex items-center gap-2 bg-[#24B99E] text-white text-[14px] px-6 py-2.5 rounded-[8px]  hover:bg-[#20a68d] transition">
                        <Save className="w-4 h-4" />
                        Save Address
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusinessProfile;
