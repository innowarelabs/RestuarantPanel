import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Eye, ChevronRight, Check, MapPin, Menu, Settings, Gift,
    Phone, Clock, Plus, Trash2, Edit2, GripVertical, Info,
    ArrowLeft, ChevronDown, ListFilter, Scissors, Coffee, Sandwich, Pizza,
    CreditCard, Bell, MessageSquare, Link, ChevronLeft, ShieldCheck, Mail, X, Image, Lock
} from 'lucide-react';

const steps = [
    { id: 1, name: 'Account Setup', icon: User },
    { id: 2, name: 'Operational Info', icon: MapPin },
    { id: 3, name: 'Menu Setup', icon: Menu },
    { id: 4, name: 'Order Settings', icon: Settings },
    { id: 5, name: 'Loyalty Program', icon: Gift },
    { id: 6, name: 'Bank Details', icon: CreditCard },
    { id: 7, name: 'Notifications Settings', icon: Bell },
    { id: 8, name: 'Support Setup', icon: MessageSquare },
    { id: 9, name: 'Connect Integration', icon: Link },
];

export default function OnboardingStep() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showAddRewardModal, setShowAddRewardModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        // Step 1
        fullName: 'romesa',
        email: 'john@burgerhouse.com',
        twoFactor: false,
        // Step 2
        contact: '69696',
        altPhone: '',
        address: '123 Main Street, New York, NY 10001',
        prepTime: '15 minutes',
        enableDelivery: true,
        enablePickup: false,
        deliveryNotes: '',
        // Step 3
        categoryName: '',
        categoryDesc: '',
        categoryVisible: true,
        categoriesCount: 3,
        itemsCount: 0,
        // Step 4
        autoAccept: false,
        timeLimit: '5',
        minOrder: '10.00',
        allowInstructions: true,
        cancelPolicy: '',
        soundNotify: true,
        riderInstructions: '',
        // Step 5
        loyaltyEnabled: true,
        pointsPerDollar: '10',
        bonusFirstOrder: true,
        bonusAmount: '50',
        minOrderLoyalty: true,
        minOrderAmount: '5',
        pointsExpire: true,
        expiryPeriod: '',
        // Step 6
        accHolder: 'John Doe',
        bankName: '',
        accNumber: '',
        routing: '',
        payoutFreq: '',
        // Step 7
        appNotify: true,
        emailNotify: true,
        smsNotify: false,
        newOrderAlert: true,
        riderAlert: true,
        complaintAlert: true,
        // Step 8
        supportEmail: 'support@burgerhouse.com',
        supportPhone: '+1 (555) 123-4567',
        autoReply: 'Thank you! Your order is being prepared.',
        chatGreeting: '',
        chatHours: '9:00 AM - 10:00 PM',
    });

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 10));
    const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const renderLeftSection = () => {
        const step = steps[currentStep > 9 ? 8 : currentStep - 1];
        const Icon = currentStep === 10 ? Eye : step.icon;

        let title = "Create Your Account";
        let desc = "Set up your login credentials to access your restaurant dashboard.";

        switch (currentStep) {
            case 2: title = "Restaurant Operational Information"; desc = "Add operational settings so customers know when you're open and how you operate."; break;
            case 3: title = "Set Up Your Menu"; desc = "Add categories and items so customers can place their orders."; break;
            case 4: title = "Order Handling Preferences"; desc = "Choose how new orders should be accepted and processed."; break;
            case 5: title = "Set Up Your Loyalty Program"; desc = "Reward loyal customers with points."; break;
            case 6: title = "Bank Information"; desc = "Add your payout details securely."; break;
            case 7: title = "Notification Preferences"; desc = "Choose how you want to be notified about important events."; break;
            case 8: title = "Support & Communication Setup"; desc = "Configure how you communicate with your customers."; break;
            case 9: title = "Connect Your Integrations"; desc = "Link your delivery platforms and tools to streamline operations."; break;
            case 10: title = "Review Your Information"; desc = "You can review or edit before completing setup."; break;
        }

        return (
            <div className="flex flex-col items-start space-y-6">
                <div className="w-[80px] h-[80px] bg-primary rounded-[12px] flex items-center justify-center text-white  shrink-0">
                    <Icon size={33} />
                </div>
                <div>
                    <p className="text-[#6B7280] text-[14px] font-[500] mb-1">Step {currentStep > 9 ? 9 : currentStep} of 9</p>
                    <h1 className="text-[26px] font-[800] text-[#1A1A1A] leading-tight">{title}</h1>
                    <p className="text-[#6B6B6B] text-[14px] mt-3 leading-relaxed max-w-[400px]">
                        {desc}
                    </p>
                </div>
            </div>
        );
    };

    const renderRightSection = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            case 6: return renderStep6();
            case 7: return renderStep7();
            case 8: return renderStep8();
            case 9: return renderStep9();
            case 10: return renderStep10();
            default: return null;
        }
    };

    const renderStep1 = () => (
        <form className="space-y-6">
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Full Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Enter your full name" className="onboarding-input" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Email</label>
                <input type="email" defaultValue={formData.email} className="onboarding-input bg-[#F0FDFA] border-primary/20 text-gray-400" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Min 8 characters"
                        className="onboarding-input pr-12 sm:placeholder:text-transparent md:placeholder:text-inherit"
                    />
                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={20} /></button>
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Re-enter password" className="onboarding-input" />
            </div>
            <div className="flex items-start sm:items-center justify-between py-2 gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Enable Two-Factor Authentication</p>
                    <p className="text-[12px] font-[400] mt-2 text-[#6B6B6B]">Add an extra layer of security to your account (optional)</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.twoFactor} onClick={() => setFormData({ ...formData, twoFactor: !formData.twoFactor })} />
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="button" onClick={handleNext} className="next-btn bg-[#E5E7EB] ">Next <ChevronRight size={18} /></button>
            </div>
        </form>
    );

    const renderStep2 = () => (
        <form className="space-y-6">
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Restaurant Contact Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="+1 (555) 123-4567" className="onboarding-input" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Alternate Phone</label>
                <input type="text" placeholder="+1 (555) 987-6543" className="onboarding-input" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Address <span className="text-red-500">*</span></label>
                <input type="text" placeholder="123 Main Street, New York, NY 10001" className="onboarding-input" />
            </div>
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Google Map Location</label>
                <div className="w-full h-40 bg-[#E5E7EB] rounded-[16px] flex flex-col items-center justify-center  border-gray-300 relative overflow-hidden">
                    <MapPin size={24} className="text-gray-400 mb-1" />
                    <p className="text-[11px] text-[#9CA3AF] absolute bottom-3">Drag the pin to set your exact location</p>
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-3">Opening Hours</label>
                <div className="space-y-3 bg-[#F9FAFB]/50 p-4 rounded-[8px] border border-[#E5E7EB]">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="grid grid-cols-12 items-center gap-4">
                            <span className="col-span-6 text-[13px] text-[#1A1A1A] font-[500]">{day}</span>
                            <div className="col-span-6 flex items-center gap-2">
                                <input type="text" className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center" placeholder="--:--" />
                                <span className="text-gray-400">—</span>
                                <input type="text" className="h-9 w-full bg-white border border-gray-200 rounded-lg px-2 text-[12px] text-center" placeholder="--:--" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Average Preparation Time <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select className="onboarding-input appearance-none">
                        <option>15 minutes</option>
                        <option>20-30 min</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-[500] text-[#1A1A1A]">Enable Delivery</span>
                    <Toggle active={formData.enableDelivery} onClick={() => setFormData({ ...formData, enableDelivery: !formData.enableDelivery })} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-[500] text-[#1A1A1A]">Enable Pickup</span>
                    <Toggle active={formData.enablePickup} onClick={() => setFormData({ ...formData, enablePickup: !formData.enablePickup })} />
                </div>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Delivery Notes</label>
                <textarea placeholder="Any special delivery instructions..." className="onboarding-input h-28 p-4 resize-none rounded-[8px]" />
            </div>
            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );

    const renderStep3 = () => (
        <div className="space-y-8">
            <div className="bg-[#F9FAFB]/50  rounded-[20px] border border-gray-100">
                <h3 className="text-[16px] font-[400] text-[#1A1A1A] mb-4">Add Menu Categories</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Category Name</label>
                        <input type="text" placeholder="e.g., Burgers, Pizzas, Drinks" className="onboarding-input h-11" />
                    </div>
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Category Description (Optional)</label>
                        <input type="text" placeholder="Brief description of this category" className="onboarding-input h-11" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[13px]">
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Category Visibility</p>
                            <p className="text-[12px] mt-1 text-[#6B6B6B]">Show this category to customers</p>
                        </div>
                        <Toggle active={formData.categoryVisible} onClick={() => setFormData({ ...formData, categoryVisible: !formData.categoryVisible })} />
                    </div>
                    <button className="w-full h-11 bg-[#E5E7EB] text-[#6B6B6B] rounded-[8px] text-[16px] flex items-center justify-center gap-2">
                        <Plus size={18} /> Add Category
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[16px]  text-[#1A1A1A]">Your Categories (3)</h3>

                <div className="bg-white min-h-[325px] border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GripVertical size={20} className="text-[#6B7280]" />
                            <div>
                                <h4 className="text-[15px]  text-[#1A1A1A]">Burgers</h4>
                                <p className="text-[13px] text-[#6B7280]">Chicken Burger with extra sauce • 2 items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <ChevronDown size={18} className="text-gray-400" />
                            <div className="p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer"><Edit2 size={16} className="text-gray-400" /></div>
                            <div className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={16} className="text-[#EF4444]" /></div>
                        </div>
                    </div>
                    <button className="h-10 px-4 border border-[#24B99E]  text-primary rounded-[6px]  text-[13px] flex items-center gap-2">
                        <Plus size={16} /> Add Item to Burgers
                    </button>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#F6F8F9]/50 rounded-[8px] border border-[#E5E7EB]">
                            <div className="flex items-center gap-4">
                                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=50&q=80" className="w-[48px] h-[48px] rounded-lg object-cover" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px]  text-[#1A1A1A]">Classic Cheeseburger</span>
                                        <span className="bg-[#ECFDF5] text-[#10B981] text-[10px] px-3 py-0.5 rounded-[2px] ">Spicy</span>
                                    </div>
                                    <p className="text-[13px] font-[500] text-primary mt-0.5">$24</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Edit2 size={14} className="text-gray-400" />
                                <Trash2 size={14} className="text-[#EF4444]" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#F6F8F9]/50 rounded-[8px] border border-[#E5E7EB]">
                            <div className="flex items-center gap-4">
                                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=50&q=80" className="w-[48px] h-[48px] rounded-lg object-cover" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px]  text-[#1A1A1A]">Classic Cheeseburger</span>
                                        <span className="bg-[#ECFDF5] text-[#10B981] text-[10px] px-3 py-0.5 rounded-[2px] ">Spicy</span>
                                    </div>
                                    <p className="text-[13px] font-[500] text-primary mt-0.5">$24</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Edit2 size={14} className="text-gray-400" />
                                <Trash2 size={14} className="text-[#EF4444]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white min-h-[150px] border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GripVertical size={20} className="text-[#6B7280] -" />
                            <div>
                                <h4 className="text-[15px]  text-[#1A1A1A]">Sides</h4>
                                <p className="text-[13px] text-[#6B7280]">Fries, salads, and more • 0 items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <div className="p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer"><Edit2 size={16} className="text-gray-400" /></div>
                            <div className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={16} className="text-[#EF4444]" /></div>
                        </div>
                    </div>
                    <button className="h-10 px-4 border border-[#24B99E]  text-primary rounded-[6px]  text-[13px] flex items-center gap-2">
                        <Plus size={16} /> Add Item to Sides
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button className="text-[13px] text-[#6B7280] font-[400] hover:underline">Skip for now</button>
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

    const renderStep4 = () => (
        <form className="space-y-7">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Auto Accept Orders</p>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">You will manually accept each order</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.autoAccept} onClick={() => setFormData({ ...formData, autoAccept: !formData.autoAccept })} />
                </div>
            </div>
            <div className="bg-[#E6F7F4] p-5 rounded-[8px] border border-[#E6F7F4] space-y-3">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Accept Order Time Limit (minutes)</label>
                <input type="text" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })} className="onboarding-input h-11" />
                <p className="text-[12px] text-[#6B7280]">Orders will be auto-cancelled if not accepted within this time</p>
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Minimum Order Amount <span className="text-red-500">*</span></label>
                <input type="text" value={formData.minOrder} className="onboarding-input" />
            </div>
            <div className="flex items-start sm:items-center justify-between py-2 gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">Allow Special Instructions</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">Customers can add special requests to their orders</p>

                </div>
                <div className="shrink-0">
                    <Toggle active={formData.allowInstructions} onClick={() => setFormData({ ...formData, allowInstructions: !formData.allowInstructions })} />
                </div>

            </div>

            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Cancellation Policy</label>
                <textarea placeholder="e.g., Orders can be cancelled within 5 minutes of placement..." className="onboarding-input h-40 py-3 resize-none" />

            </div>
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[#1A1A1A]">New Order Sound Notification</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">Play a sound when new orders arrive  </p>

                </div>
                <div className="shrink-0">
                    <Toggle active={formData.soundNotify} onClick={() => setFormData({ ...formData, soundNotify: !formData.soundNotify })} />
                </div>

            </div>
            <div>
                <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-2">Rider Pickup Instructions</label>
                <textarea placeholder="e.g., Please use the side entrance for pickups..." className="onboarding-input h-40 p-4 resize-none" />
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={handleNext} className="text-[13px] text-[#6B7280] font-[400] hover:underline">Skip for now</button>
            </div>
            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );

    const renderStep5 = () => (
        <div className="space-y-10">
            {/* Enable Loyalty */}
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-[14px] font-[500] text-[#1A1A1A]">Enable Loyalty Points</h3>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">Turn on to start rewarding customers with points</p>
                </div>
                <div className="shrink-0">
                    <Toggle active={formData.loyaltyEnabled} onClick={() => setFormData({ ...formData, loyaltyEnabled: !formData.loyaltyEnabled })} />
                </div>
            </div>

            <div className="space-y-5">
                <h3 className="text-[16px] font-[800] text-[#1A1A1A]">Points Earning Settings</h3>

                {/* Points Per Dollar */}
                <div className="space-y-2">
                    <label className="block text-[14px] font-[500] text-[#1A1A1A]">Points earned per $ spent</label>
                    <input
                        type="text"
                        value={formData.pointsPerDollar}
                        onChange={(e) => setFormData({ ...formData, pointsPerDollar: e.target.value })}
                        className="onboarding-input"
                    />
                </div>

                {/* First Order Bonus */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Give bonus points on first order?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Reward new customers with extra points</p>
                        </div>
                        <Toggle active={formData.bonusFirstOrder} onClick={() => setFormData({ ...formData, bonusFirstOrder: !formData.bonusFirstOrder })} />
                    </div>
                    {formData.bonusFirstOrder && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Bonus points amount</label>
                            <input
                                type="text"
                                value={formData.bonusAmount}
                                onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>

                {/* Minimum Order */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Minimum order amount to earn points?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set a minimum spend requirement</p>
                        </div>
                        <Toggle active={formData.minOrderLoyalty} onClick={() => setFormData({ ...formData, minOrderLoyalty: !formData.minOrderLoyalty })} />
                    </div>
                    {formData.minOrderLoyalty && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Minimum amount ($)</label>
                            <input
                                type="text"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>

                {/* Expiry */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Points expire?</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">Set an expiration period for points</p>
                        </div>
                        <Toggle active={formData.pointsExpire} onClick={() => setFormData({ ...formData, pointsExpire: !formData.pointsExpire })} />
                    </div>
                    {formData.pointsExpire && (
                        <div className="pl-6 border-l-[3px] border-primary ml-1 space-y-3 animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Expiry period</label>
                            <input
                                type="text"
                                placeholder="e.g., 6 months"
                                value={formData.expiryPeriod}
                                onChange={(e) => setFormData({ ...formData, expiryPeriod: e.target.value })}
                                className="onboarding-input"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Reward Catalog */}
            <div className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[16px] font-[800] text-[#1A1A1A]">Reward Catalog</h3>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">Items customers can redeem with their points</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingReward(null);
                            setShowAddRewardModal(true);
                        }}
                        className="h-10 w-full sm:w-auto px-4 bg-primary text-white rounded-[8px] text-[14px] font-[500] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Reward Item
                    </button>
                </div>

                <div className="space-y-3">
                    {[
                        { name: 'Free Ice Cream', desc: 'Ice Cream Cone • Choose any flavour', points: 175, status: 'Active', icon: '🍦' },
                        { name: 'Free Soft Drink', desc: 'Soft Drink • Any size soft drink', points: 120, status: 'Active', icon: '🥤' },
                        { name: 'Free Fries', desc: 'French Fries • Regular portion', points: 150, status: 'Active', icon: '🍟' },
                        { name: 'Free Burger', desc: 'Cheeseburger • Classic cheeseburger', points: 400, status: 'Inactive', icon: '🍔' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-[#E5E7EB] rounded-[8px] ">
                            <div className="flex items-center gap-4">
                                <div className="w-[64px] h-[64px] bg-[#F6F8F9] rounded-[12px] flex items-center justify-center text-[24px]">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[15px] font-[400] text-[#1A1A1A]">{item.name}</h4>
                                    <p className="text-[13px] text-[#6B7280]">{item.desc}</p>
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <span className="text-[12px] font-[500] text-primary bg-[#E6F7F4] px-2 py-0.5 rounded-[4px]">{item.points} points</span>
                                        <span className={`text-[12px] font-[500] px-2 py-0.5 rounded-[4px] ${item.status === 'Active' ? 'text-[#10B981] bg-[#ECFDF5]' : 'text-gray-400 bg-gray-100'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditingReward(item);
                                        setShowAddRewardModal(true);
                                    }}
                                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Box */}
            <div className="bg-[#E6F7F4] border border-[#24B99E] p-5 rounded-[12px] space-y-3">
                <h4 className="text-[13px] font-[500] text-primary">Loyalty Program Summary</h4>
                <ul className="space-y-2">
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>Earn {formData.pointsPerDollar || '0'} points per $1 spent</span>
                    </li>
                    {formData.bonusFirstOrder && (
                        <li className="text-[12px] text-[#475569] flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span>New customers get {formData.bonusAmount || '0'} bonus points on first order</span>
                        </li>
                    )}
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{formData.pointsExpire ? `Points expire after period` : 'Points never expire'}</span>
                    </li>
                    <li className="text-[12px] text-[#475569] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>3 active rewards available</span>
                    </li>
                </ul>
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

    const renderStep6 = () => (
        <form className="space-y-6">
            {/* Security Note */}
            <div className="bg-[#FEF3C7] p-5 rounded-[12px] border border-[#F59E0B] flex gap-3">
                <Lock size={18} className="text-[#92400E] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#92400E] leading-relaxed">
                    Your banking information is encrypted and stored securely. We never share your details with third parties.
                </p>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Holder Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.accHolder}
                    onChange={(e) => setFormData({ ...formData, accHolder: e.target.value })}
                    className="onboarding-input"
                />
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Bank Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="e.g., Chase Bank, Bank of America"
                    className="onboarding-input"
                />
            </div>

            {/* Account Number / IBAN */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Account Number / IBAN <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="Enter your account number"
                    className="onboarding-input"
                />
            </div>

            {/* Routing Number */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Routing Number</label>
                <input
                    type="text"
                    placeholder="9-digit routing number"
                    className="onboarding-input"
                />
            </div>

            {/* Payout Frequency */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#1A1A1A]">Payout Frequency <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select
                        className="onboarding-input appearance-none"
                        value={formData.payoutFreq}
                        onChange={(e) => setFormData({ ...formData, payoutFreq: e.target.value })}
                    >
                        <option value="">Select frequency...</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Payout Summary */}
            <div className="bg-[#E6F7F4] p-5 rounded-[12px] mt-4">
                <p className="text-[13px] text-[#475569]">
                    <span className="font-[600]">Expected payout:</span> {formData.payoutFreq ? `${formData.payoutFreq} settlement` : 'Select frequency above'}
                </p>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className={`next-btn ${formData.payoutFreq ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'} px-10 transition-all`}
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );

    const renderStep7 = () => {
        const enabledChannels = [formData.appNotify, formData.emailNotify, formData.smsNotify].filter(Boolean).length;

        return (
            <div className="space-y-10">
                {/* General Notifications */}
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

                {/* Alert Preferences */}
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

                {/* Summary Box */}
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
    };

    const renderStep8 = () => (
        <form className="space-y-6">
            {/* Support Email */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Support Email <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@burgerhouse.com"
                    className="onboarding-input"
                />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Contact Phone <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="onboarding-input"
                />
            </div>

            {/* Auto-reply Message */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Auto-reply Message</label>
                <textarea
                    value={formData.autoReply}
                    onChange={(e) => setFormData({ ...formData, autoReply: e.target.value })}
                    placeholder="Message sent to customers when they contact you..."
                    className="onboarding-input h-[100px] py-3 resize-none"
                />
            </div>

            {/* Chat Greeting Message */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Greeting Message</label>
                <input
                    type="text"
                    value={formData.chatGreeting}
                    onChange={(e) => setFormData({ ...formData, chatGreeting: e.target.value })}
                    placeholder="First message customers see when they open chat..."
                    className="onboarding-input"
                />
            </div>

            {/* Chat Availability Hours */}
            <div className="space-y-2">
                <label className="block text-[14px] font-[500] text-[#111827]">Chat Availability Hours (Optional)</label>
                <input
                    type="text"
                    value={formData.chatHours}
                    onChange={(e) => setFormData({ ...formData, chatHours: e.target.value })}
                    placeholder="9:00 AM - 10:00 PM"
                    className="onboarding-input"
                />
            </div>

            {/* Preview Box */}
            <div className="bg-[#E6F7F4] border border-[#24B99E]/30 p-5 rounded-[12px] mt-4 space-y-3">
                <h4 className="text-[13px] font-[600] text-primary">Preview: Auto-reply</h4>
                <div className="bg-white p-4 rounded-[8px] border border-[#24B99E]/10">
                    <p className="text-[14px] text-[#111827] leading-relaxed">
                        {formData.autoReply || 'Your auto-reply message will appear here...'}
                    </p>
                </div>
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );

    const renderStep9 = () => {
        const integrations = [
            { title: 'Uber Eats', desc: 'Sync orders and menu items automatically', icon: '🍔' },
            { title: 'Deliveroo', desc: 'Real-time order management and tracking', icon: '🛵' },
            { title: 'Just Eat', desc: "Connect to UK's top leading food delivery", icon: '🍕' },
            { title: 'Marketing', desc: 'Customer relationship management integration', icon: '📊' },
            { title: 'FoodHub', desc: 'Zero commission food delivery platform', icon: '🥘' },
            { title: 'POS System', desc: 'Connect your point of sale system', icon: '💳' },
        ];

        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {integrations.map((item, idx) => (
                        <div key={idx} className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 flex flex-col justify-between hover:border-primary/40 transition-all">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#E6F7F4] rounded-[8px] flex items-center justify-center text-[22px]">
                                            {item.icon}
                                        </div>
                                        <h4 className="text-[16px] font-[400] text-[#111111]">{item.title}</h4>
                                    </div>
                                    <span className="text-[12px] font-[400] text-[#64748B] bg-[#F3F4F6] px-2.5 py-2 rounded-[8px]">
                                        Not Connected
                                    </span>
                                </div>
                                <p className="text-[14px] text-[#64748B] leading-[1.5]">
                                    {item.desc}
                                </p>
                            </div>
                            <button className="w-full h-[45px] bg-[#24B99E] text-white rounded-[8px] font-[500] text-[16px] hover:bg-[#20a38b] transition-all">
                                Connect
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={handleNext} className="text-[13px] text-[#6B7280] font-[400] hover:underline">
                        Skip for now
                    </button>
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
    };

    const renderStep10 = () => (
        <div className="space-y-10">
            <div className="space-y-5">
                <p className="text-[15px] text-[#6B7280] leading-[1.6]">
                    Please review all the information you've provided. You can click on previous steps in the progress bar above to make changes, or click the button below to preview everything.
                </p>
                <button
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full h-[56px] bg-[#24B99E] text-white rounded-[8px] font-[500] text-[16px] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-all shadow-sm"
                >
                    <Eye size={20} /> Preview All Information
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    'Account Setup', 'Operational Info', 'Menu Setup', 'Order Settings',
                    'Loyalty Program', 'Bank Details', 'Notifications', 'Support Setup', 'Integrations'
                ].map((name, idx) => (
                    <div key={idx} className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                        <h4 className="text-[15px] font-[400] text-[#1A1A1A] mb-1.5">{name}</h4>
                        <p className="text-[13px] text-[#6B7280] flex items-center gap-1.5 font-[400]">
                            <Check size={14} className="text-[#24B99E]" strokeWidth={3} /> Completed
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[#E6F7F4] border border-[#24B99E]/20 p-5 rounded-[8px]">
                <p className="text-[14px] text-[#111827]">
                    <span className="font-[600]">Ready to go!</span> Click "Complete Setup" below to finish and access your dashboard.
                </p>
            </div>

            <button
                type="button"
                className="sm:hidden mt-4 h-[52px] w-full bg-[#24B99E] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#20a38b] transition-all"
                onClick={() => navigate('/admin-dashboard')}
            >
                Complete Setup <ChevronRight size={18} />
            </button>

            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    type="button"
                    className="hidden sm:flex h-[52px] min-w-[180px] bg-[#24B99E] text-white rounded-[10px] font-bold text-[15px] items-center justify-center gap-2 hover:bg-[#20a38b] transition-all"
                    onClick={() => navigate('/admin-dashboard')}
                >
                    Complete Setup <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-avenir pb-20">
            <header className="h-[96px] bg-white border-b border-gray-400 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-[8px] flex items-center justify-center text-white  text-[16px]">R</div>
                    <span className="text-[18px] font-[600] text-[#1A1A1A]">Restaurant</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[14px] font-[500] text-[#0F1724] leading-tight">John's Burger House</p>
                        <p className="text-[12px] text-[#6B7280]">Restaurant Owner</p>
                    </div>
                    <div className="w-[44px] h-[44px] bg-primary rounded-full flex items-center justify-center text-white font-[600] text-[16px]">JB</div>
                </div>
            </header>

            <div className="w-full bg-white border-b border-gray-100 pt-8 pb-3 px-4 sticky top-[72px] z-40">
                <div className="max-w-[1240px] mx-auto overflow-x-auto scrollbar-hide">
                    <div className="flex items-start justify-between min-w-[1000px] px-4">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center flex-1 cursor-pointer group" onClick={() => setCurrentStep(step.id)}>
                                    <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[15px] font-bold transition-all duration-300 border
                                        ${(currentStep === step.id || (currentStep > 9 && step.id === 9)) ? 'bg-primary text-white border-primary shadow-lg' : currentStep > step.id ? 'bg-primary text-white border-primary' : 'bg-white text-[#9CA3AF] border-gray-200'}`}>
                                        {(currentStep > step.id && step.id < 9) || (currentStep > 9 && step.id === 9) ? <Check size={18} strokeWidth={3} /> : step.id}
                                    </div>
                                    <span className={`mt-3 text-[12px] font-[500] text-center w-24 leading-tight ${(currentStep === step.id || (currentStep > 9 && step.id === 9)) ? 'text-primary' : 'text-[#9CA3AF]'}`}>{step.name}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 h-[2px] bg-gray-300 mt-5 mx-2 min-w-[20px] relative">
                                        <div className={`absolute left-0 top-0 h-full bg-primary transition-all duration-500 ${currentStep > index + 1 ? 'w-full' : 'w-0'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <main className="flex-1 p-6 sm:p-12 sm:pt-14 overflow-y-auto">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <div className="lg:col-span-4">{renderLeftSection()}</div>
                    <div className="lg:col-span-8 rounded-[21px] p-6 sm:p-10 border border-[#00000033]  bg-[#F6F8F9]">{renderRightSection()}</div>
                </div>
            </main>

            {showPreviewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)} />
                    <div className="bg-white w-full max-w-[800px] rounded-[32px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-[24px] font-bold text-[#1A1A1A]">Preview Your Setup</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="text-2xl text-gray-400">×</button>
                        </div>
                        <div className="p-8 max-h-[75vh] overflow-y-auto space-y-10 custom-scrollbar">
                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">A. Account</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Name</p><p className="font-semibold text-[#111827]">{formData.fullName}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Email</p><p className="font-semibold text-[#111827]">{formData.email}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Two-Factor Auth</p><p className="font-semibold text-[#111827]">{formData.twoFactor ? 'Enabled' : 'Disabled'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">B. Operational Info</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div className="col-span-2"><p className="text-[#9CA3AF] font-[500] mb-1">Address</p><p className="font-semibold text-[#111827]">{formData.address}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Phone</p><p className="font-semibold text-[#111827]">{formData.contact}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Avg Prep Time</p><p className="font-semibold text-[#111827]">{formData.prepTime}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Services</p><p className="font-semibold text-[#111827]">{[formData.enableDelivery && 'Delivery', formData.enablePickup && 'Pickup'].filter(Boolean).join(', ')}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">C. Menu Setup</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Categories</p><p className="font-semibold text-[#111827]">{formData.categoriesCount} categories</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Items</p><p className="font-semibold text-[#111827]">{formData.itemsCount} items added</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">D. Order Settings</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Auto-accept</p><p className="font-semibold text-[#111827]">{formData.autoAccept ? 'Yes' : 'No'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Time Limit</p><p className="font-semibold text-[#111827]">{formData.timeLimit} mins</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Min Order</p><p className="font-semibold text-[#111827]">${formData.minOrder}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Instructions</p><p className="font-semibold text-[#111827]">{formData.allowInstructions ? 'Allowed' : 'Not Allowed'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">E. Loyalty Program</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Status</p><p className="font-semibold text-[#111827]">{formData.loyaltyEnabled ? 'Enabled' : 'Disabled'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Points/$ spent</p><p className="font-semibold text-[#111827]">{formData.pointsPerDollar} points</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">First Order Bonus</p><p className="font-semibold text-[#111827]">{formData.bonusFirstOrder ? `${formData.bonusAmount} pts` : 'No'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Min Order for Pts</p><p className="font-semibold text-[#111827]">${formData.minOrderAmount || '0.00'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">F. Bank Information</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Holder Name</p><p className="font-semibold text-[#111827]">{formData.accHolder}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Frequency</p><p className="font-semibold text-[#111827]">{formData.payoutFreq}</p></div>
                                    <div className="col-span-2"><p className="text-[#9CA3AF] font-[500] mb-1">Routing Number</p><p className="font-semibold text-[#111827]">{formData.routing}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">G. Notifications</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">App / Email / SMS</p><p className="font-semibold text-[#111827]">{[formData.appNotify && 'App', formData.emailNotify && 'Email', formData.smsNotify && 'SMS'].filter(Boolean).join(' / ') || 'None'}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Special Alerts</p><p className="font-semibold text-[#111827]">{[formData.newOrderAlert && 'New Order', formData.riderAlert && 'Rider', formData.complaintAlert && 'Complaints'].filter(Boolean).length} active</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">H. Support Setup</h3>
                                <div className="grid grid-cols-2 gap-y-6 text-[14px]">
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Support Email</p><p className="font-semibold text-[#111827]">{formData.supportEmail}</p></div>
                                    <div><p className="text-[#9CA3AF] font-[500] mb-1">Phone</p><p className="font-semibold text-[#111827]">{formData.supportPhone}</p></div>
                                    <div className="col-span-2"><p className="text-[#9CA3AF] font-[500] mb-1">Chat Hours</p><p className="font-semibold text-[#111827]">{formData.chatHours || 'Not specified'}</p></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-2">I. Integrations</h3>
                                <div className="bg-[#F8FAFC] p-4 rounded-[12px] border border-gray-100">
                                    <p className="text-[13px] text-[#64748B]">Multiple delivery and POS integrations available to be connected after setup.</p>
                                </div>
                            </section>
                        </div>
                        <div className="p-8 pt-4"><button onClick={() => setShowPreviewModal(false)} className="w-full h-[56px] bg-[#24B99E] text-white rounded-[16px] font-bold">Close Preview</button></div>
                    </div>
                </div>
            )}

            {/* Add Reward Item Modal */}
            {showAddRewardModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowAddRewardModal(false)} />
                    <div className="bg-white w-full max-w-[500px] rounded-[24px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-[18px] font-bold text-[#1A1A1A]">{editingReward ? 'Edit Reward Item' : 'Add Reward Item'}</h2>
                            <button onClick={() => setShowAddRewardModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            {/* Reward Name */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Reward Name</label>
                                <input type="text" defaultValue={editingReward?.name || ''} placeholder="e.g., Free Ice Cream" className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px]" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Points Required */}
                                <div className="space-y-1">
                                    <label className="block text-[13px] font-[500] text-[#1A1A1A]">Points Required</label>
                                    <input type="text" defaultValue={editingReward?.points || ''} placeholder="e.g., 175" className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px]" />
                                </div>

                                {/* Choose Menu Item */}
                                <div className="space-y-1">
                                    <label className="block text-[13px] font-[500] text-[#1A1A1A]">Choose Menu Item</label>
                                    <div className="relative">
                                        <select className="onboarding-input !h-[44px] !rounded-[8px] !text-[13px] appearance-none">
                                            <option value="">Select an item...</option>
                                            <option value="1">Burger</option>
                                            <option value="2">Fries</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Description</label>
                                <textarea defaultValue={editingReward?.desc || ''} placeholder="Brief description of the reward" className="onboarding-input !h-[70px] !rounded-[8px] !text-[13px] py-2 resize-none" />
                            </div>

                            {/* Reward Image */}
                            <div className="space-y-1">
                                <label className="block text-[13px] font-[500] text-[#1A1A1A]">Reward Image (optional)</label>
                                <div className="flex gap-4">
                                    <div className="w-[56px] h-[56px] bg-[#F6F8F9] rounded-[10px] border border-gray-200 border-dashed flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
                                        {editingReward?.icon ? (
                                            <span className="text-[24px]">{editingReward.icon}</span>
                                        ) : (
                                            <Image size={20} />
                                        )}
                                    </div>
                                    <input type="text" placeholder="Image URL" className="onboarding-input !h-[56px] flex-1 !rounded-[8px] !text-[13px]" />
                                </div>
                            </div>

                            {/* Make Active Toggle */}
                            <div className="flex items-center justify-between pt-1">
                                <div>
                                    <p className="text-[13px] font-[500] text-[#1A1A1A]">Make this reward active</p>
                                    <p className="text-[11px] text-[#6B7280]">Customers can immediately redeem this reward</p>
                                </div>
                                <Toggle active={true} onClick={() => { }} />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 pt-0 grid grid-cols-2 gap-3 mt-1">
                            <button
                                onClick={() => setShowAddRewardModal(false)}
                                className="h-[44px] border border-gray-200 text-[#1A1A1A] font-[500] rounded-[10px] hover:bg-gray-50 transition-colors text-[13px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowAddRewardModal(false)}
                                className="h-[44px] bg-[#99E5D9] text-white font-[500] rounded-[10px] hover:bg-primary transition-colors text-[13px]"
                            >
                                {editingReward ? 'Update Reward' : 'Save Reward'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .onboarding-input { width: 100%; height: 52px; padding: 0 20px; background: white; border: 1px solid #E5E7EB; border-radius: 14px; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; }
                @media (min-width: 640px) { .onboarding-input { font-size: 15px; } }
                .onboarding-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(36, 185, 158, 0.05); }
                .next-btn { height: 45px; min-width: 103px; padding: 0 32px; background: #E5E7EB; color: #6B7280; font-weight: 500; font-size: 14px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; border: none; }
                .prev-btn { height: 42px; min-width: 124px; padding: 0 32px; background: white; border: 1px solid #E5E7EB; color: #6B6B6B; font-weight: 500; font-size: 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
            `}</style>
        </div>
    );
}

function Toggle({ active, onClick }) {
    return (
        <button type="button" onClick={onClick} className={`w-[48px] h-[24px] rounded-full p-1 transition-colors ${active ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
            <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${active ? 'translate-x-[24px]' : 'translate-x-0'}`} />
        </button>
    );
}

function NotificationToggle({ title, desc, active, onClick }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
                <p className="text-[15px] font-[500] text-[#111827]">{title}</p>
                <p className="text-[13px] text-[#6B7280]">{desc}</p>
            </div>
            <Toggle active={active} onClick={onClick} />
        </div>
    );
}
