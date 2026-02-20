import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Eye, Check, MapPin, Menu, Settings, Gift,
    ChevronDown,
    CreditCard, Bell, MessageSquare, Link, X, Image
} from 'lucide-react';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import Step8 from './Step8';
import Step9 from './Step9';
import Step10 from './Step10';
import Toggle from './Toggle';

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

const WEBSITE_HEADER_REQUIRED_PX = { width: 1440, height: 495 };
const WEBSITE_FOOTER_LEFT_REQUIRED_PX = { width: 604, height: 425 };
const WEBSITE_FOOTER_RIGHT_REQUIRED_PX = { width: 604, height: 425 };
const CATEGORY_IMAGE_REQUIRED_PX = { width: 270, height: 208 };

export default function OnboardingStep() {
    const navigate = useNavigate();
    const nextCategoryIdRef = useRef(1);
    const nextItemIdRef = useRef(1);

    const createCategoryId = () => `category-${nextCategoryIdRef.current++}`;
    const createItemId = () => `item-${nextItemIdRef.current++}`;
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showAddRewardModal, setShowAddRewardModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [categoryImage, setCategoryImage] = useState(null);
    const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState('');
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [itemImage, setItemImage] = useState(null);
    const [itemImagePreviewUrl, setItemImagePreviewUrl] = useState('');
    const [itemForm, setItemForm] = useState({
        categoryId: '',
        name: '',
        price: '',
        description: '',
        prepTimeMinutes: '15',
        available: true,
        tags: [],
        addOns: [{ name: '', price: '' }],
    });

    const [brandingFiles, setBrandingFiles] = useState({
        companyLogo: null,
        companyLogoPreviewUrl: '',
        websiteHeader: null,
        websiteHeaderPreviewUrl: '',
        websiteFooterLeft: null,
        websiteFooterLeftPreviewUrl: '',
        websiteFooterRight: null,
        websiteFooterRightPreviewUrl: '',
    });

    const setBrandingFile = (key, file) => {
        setBrandingFiles((prev) => {
            const previewKey = `${key}PreviewUrl`;
            const prevPreviewUrl = prev[previewKey];
            if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);

            const nextPreviewUrl = file ? URL.createObjectURL(file) : '';
            return { ...prev, [key]: file, [previewKey]: nextPreviewUrl };
        });
    };

    const setCategoryImageFile = (file) => {
        if (categoryImagePreviewUrl) URL.revokeObjectURL(categoryImagePreviewUrl);
        setCategoryImage(file);
        setCategoryImagePreviewUrl(file ? URL.createObjectURL(file) : '');
    };

    const setItemImageFile = (file) => {
        if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl);
        setItemImage(file);
        setItemImagePreviewUrl(file ? URL.createObjectURL(file) : '');
    };

    const resetCategoryForm = () => {
        if (categoryImagePreviewUrl) URL.revokeObjectURL(categoryImagePreviewUrl);
        setEditingCategoryId(null);
        setCategoryImage(null);
        setCategoryImagePreviewUrl('');
        setFormData((prev) => ({
            ...prev,
            categoryName: '',
            categoryDesc: '',
            categoryVisible: true,
        }));
    };

    const saveCategory = () => {
        const trimmedName = formData.categoryName.trim();
        if (!trimmedName) return;

        if (!editingCategoryId && !categoryImage) return;

        setCategories((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === editingCategoryId);
            const nextId = editingCategoryId || createCategoryId();
            const previous = existingIndex >= 0 ? prev[existingIndex] : null;
            const nextCategory = {
                id: nextId,
                name: trimmedName,
                description: formData.categoryDesc.trim(),
                visible: !!formData.categoryVisible,
                imageName: categoryImage?.name || previous?.imageName || '',
            };

            if (existingIndex >= 0) {
                const copy = [...prev];
                copy[existingIndex] = nextCategory;
                return copy;
            }

            return [nextCategory, ...prev];
        });

        setFormData((prev) => ({
            ...prev,
            categoriesCount: (editingCategoryId ? prev.categoriesCount : prev.categoriesCount + 1),
        }));

        resetCategoryForm();
    };

    const startEditCategory = (category) => {
        if (categoryImagePreviewUrl) URL.revokeObjectURL(categoryImagePreviewUrl);
        setEditingCategoryId(category.id);
        setCategoryImage(null);
        setCategoryImagePreviewUrl('');
        setFormData((prev) => ({
            ...prev,
            categoryName: category.name,
            categoryDesc: category.description || '',
            categoryVisible: !!category.visible,
        }));
    };

    const deleteCategory = (categoryId) => {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        setItems((prev) => {
            const removedCount = prev.filter((i) => i.categoryId === categoryId).length;
            const next = prev.filter((i) => i.categoryId !== categoryId);
            if (removedCount) {
                setFormData((fd) => ({ ...fd, itemsCount: Math.max(0, fd.itemsCount - removedCount) }));
            }
            return next;
        });
        setFormData((prev) => ({ ...prev, categoriesCount: Math.max(0, prev.categoriesCount - 1) }));

        if (editingCategoryId === categoryId) resetCategoryForm();
    };

    const resetItemModal = () => {
        if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl);
        setItemImage(null);
        setItemImagePreviewUrl('');
        setItemForm({
            categoryId: '',
            name: '',
            price: '',
            description: '',
            prepTimeMinutes: '15',
            available: true,
            tags: [],
            addOns: [{ name: '', price: '' }],
        });
    };

    const closeAddItemModal = () => {
        setShowAddItemModal(false);
        resetItemModal();
    };

    const saveItem = () => {
        const trimmedName = itemForm.name.trim();
        const trimmedPrice = itemForm.price.trim();
        if (!trimmedName || !trimmedPrice || !itemForm.categoryId) return;

        const newItem = {
            id: createItemId(),
            categoryId: itemForm.categoryId,
            name: trimmedName,
            price: trimmedPrice,
            description: itemForm.description.trim(),
            prepTimeMinutes: itemForm.prepTimeMinutes.trim(),
            available: !!itemForm.available,
            tags: itemForm.tags,
            addOns: itemForm.addOns
                .map((a) => ({ name: a.name.trim(), price: a.price.trim() }))
                .filter((a) => a.name || a.price),
            imageName: itemImage?.name || '',
        };

        setItems((prev) => [newItem, ...prev]);
        setFormData((prev) => ({ ...prev, itemsCount: prev.itemsCount + 1 }));
        setShowAddItemModal(false);
        resetItemModal();
    };

    // Form States
    const [formData, setFormData] = useState({
        // Step 1
        fullName: 'romesa',
        email: 'john@burgerhouse.com',
        twoFactor: false,
        companyName: '',
        // Step 2
        contact: '69696',
        altPhone: '',
        address: '123 Main Street, New York, NY 10001',
        companyLocation: '',
        prepTime: '15 minutes',
        enableDelivery: true,
        enablePickup: false,
        deliveryNotes: '',
        // Step 3
        categoryName: '',
        categoryDesc: '',
        categoryVisible: true,
        categoriesCount: 0,
        itemsCount: 0,
        // Step 4
        autoAccept: false,
        timeLimit: '5',
        minOrder: '10.00',
        allowInstructions: true,
        cancelPolicy: '',
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
        let desc = "Add your basic account and brand details to access your restaurant dashboard.";

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
            case 1: return (
                <Step1
                    formData={formData}
                    setFormData={setFormData}
                    brandingFiles={brandingFiles}
                    setBrandingFile={setBrandingFile}
                    handleNext={handleNext}
                />
            );
            case 2: return (
                <Step2
                    formData={formData}
                    setFormData={setFormData}
                    brandingFiles={brandingFiles}
                    setBrandingFile={setBrandingFile}
                    WEBSITE_HEADER_REQUIRED_PX={WEBSITE_HEADER_REQUIRED_PX}
                    WEBSITE_FOOTER_LEFT_REQUIRED_PX={WEBSITE_FOOTER_LEFT_REQUIRED_PX}
                    WEBSITE_FOOTER_RIGHT_REQUIRED_PX={WEBSITE_FOOTER_RIGHT_REQUIRED_PX}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                />
            );
            case 3: return (
                <Step3
                    categories={categories}
                    items={items}
                    editingCategoryId={editingCategoryId}
                    formData={formData}
                    setFormData={setFormData}
                    categoryImage={categoryImage}
                    categoryImagePreviewUrl={categoryImagePreviewUrl}
                    setCategoryImageFile={setCategoryImageFile}
                    CATEGORY_IMAGE_REQUIRED_PX={CATEGORY_IMAGE_REQUIRED_PX}
                    saveCategory={saveCategory}
                    resetCategoryForm={resetCategoryForm}
                    startEditCategory={startEditCategory}
                    deleteCategory={deleteCategory}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                    showAddItemModal={showAddItemModal}
                    setShowAddItemModal={setShowAddItemModal}
                    closeAddItemModal={closeAddItemModal}
                    itemForm={itemForm}
                    setItemForm={setItemForm}
                    itemImagePreviewUrl={itemImagePreviewUrl}
                    setItemImageFile={setItemImageFile}
                    saveItem={saveItem}
                />
            );
            case 4: return <Step4 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 5: return (
                <Step5
                    formData={formData}
                    setFormData={setFormData}
                    setEditingReward={setEditingReward}
                    setShowAddRewardModal={setShowAddRewardModal}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                />
            );
            case 6: return <Step6 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 7: return <Step7 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 8: return <Step8 formData={formData} setFormData={setFormData} handlePrev={handlePrev} handleNext={handleNext} />;
            case 9: return <Step9 handlePrev={handlePrev} handleNext={handleNext} />;
            case 10: return <Step10 setShowPreviewModal={setShowPreviewModal} navigate={navigate} handlePrev={handlePrev} />;
            default: return null;
        }
    };

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
                .onboarding-textarea { width: 100%; height: 100px; padding: 10px 20px; background: white; border: 1px solid #E5E7EB; border-radius: 14px; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; }
                @media (min-width: 640px) { .onboarding-textarea { font-size: 15px; } }
                .onboarding-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(36, 185, 158, 0.05); }
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
