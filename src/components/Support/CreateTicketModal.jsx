import React, { useState } from 'react';
import { X, Paperclip, ChevronDown } from 'lucide-react';

const CreateTicketModal = ({ isOpen, onClose }) => {
    const [contactMethods, setContactMethods] = useState({ email: false, phone: true });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[12px] border border-[#00000033] w-[500px] max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-[18px] font-bold text-general-text">Create Ticket for Platform Support</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Brief description of your issue"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[14px] font-[500] text-general-text mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                                    <option>Payments</option>
                                    <option>Technical</option>
                                    <option>Integrations</option>
                                    <option>Account</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[14px] font-[500] text-general-text mb-2">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                                    <option>Low</option>
                                    <option>Normal</option>
                                    <option>High</option>
                                    <option>Urgent</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Provide detailed information about your issue"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-gray-400"
                        ></textarea>
                    </div>

                    {/* Link Order */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Link an Order (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., #ORD-8765"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Attach Evidence */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Attach Evidence
                        </label>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-[8px] text-[14px] font-[500] text-general-text hover:bg-gray-50 transition-colors shadow-sm">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            Upload Files
                        </button>
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">
                            Preferred Contact Method
                        </label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={contactMethods.email}
                                    onChange={() => setContactMethods({ ...contactMethods, email: !contactMethods.email })}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${contactMethods.email ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                                    {contactMethods.email && <div className="w-2 h-1 border-l-1.5 border-b-1.5 border-white -rotate-45 mb-0.5"></div>}
                                </div>
                                <span className="text-[13px] font-[500] text-gray-600">Email</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={contactMethods.phone}
                                    onChange={() => setContactMethods({ ...contactMethods, phone: !contactMethods.phone })}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${contactMethods.phone ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                                    {contactMethods.phone && <div className="w-2 h-1 border-l-1.5 border-b-1.5 border-white -rotate-45 mb-0.5"></div>}
                                </div>
                                <span className="text-[13px] font-[500] text-gray-600">Phone</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-[#F9FAFB]/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-200 text-gray-600 text-[14px] font-[500] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // Submit logic
                            onClose();
                        }}
                        className="px-6 py-2.5 bg-[#2BB29C] text-white text-[14px] font-[500] rounded-[8px] hover:bg-[#24A18C] transition-colors shadow-sm"
                    >
                        Submit Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTicketModal;
