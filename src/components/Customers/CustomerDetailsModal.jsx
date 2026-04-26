import React, { useState, useEffect } from 'react';
import {
    X,
    Phone,
    Mail,
    MapPin,
    ChevronRight,
    ShoppingBag,
    DollarSign,
    Award,
    Crosshair,
    FileText,
    Plus,
    Ban,
    Download,
    CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerDetailsModal({ isOpen, onClose, customer, customerDetails, loadingDetails }) {
    const [addNoteOpen, setAddNoteOpen] = useState(false);
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [unblockConfirmOpen, setUnblockConfirmOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteDescription, setNoteDescription] = useState('');
    const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);

    useEffect(() => {
        if (customerDetails) {
            setIsCustomerBlocked(!!customerDetails.is_blocked);
        }
    }, [customerDetails]);

    useEffect(() => {
        if (!isOpen) {
            setAddNoteOpen(false);
            setBlockConfirmOpen(false);
            setUnblockConfirmOpen(false);
            setNoteTitle('');
            setNoteDescription('');
        }
    }, [isOpen]);

    if (!isOpen || !customer) return null;

    const SkeletonLoader = () => (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-[12px] bg-gray-200" />
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
                ))}
            </div>
        </div>
    );

    const displayData = customerDetails || customer;

    const formatCurrency = (amount) => {
        if (amount == null || amount === '') return '$0.00';
        if (typeof amount === 'number') {
            return `$${amount.toFixed(2)}`;
        }
        return String(amount);
    };

    const averageOrderValue = customerDetails?.average_order_value;
    const avgLabel =
        averageOrderValue != null && !Number.isNaN(Number(averageOrderValue))
            ? formatCurrency(Number(averageOrderValue))
            : '—';

    const addresses = Array.isArray(customerDetails?.delivery_addresses)
        ? customerDetails.delivery_addresses
        : [];

    const rewards = Array.isArray(customerDetails?.rewards_available)
        ? customerDetails.rewards_available
        : [];

    const orderHistory = Array.isArray(customerDetails?.order_history)
        ? customerDetails.order_history
        : [];

    const handleSaveNote = () => {
        if (!noteTitle.trim() && !noteDescription.trim()) {
            toast.error('Add a title or description');
            return;
        }
        toast.success('Note saved');
        setAddNoteOpen(false);
        setNoteTitle('');
        setNoteDescription('');
    };

    const handleConfirmBlock = () => {
        setIsCustomerBlocked(true);
        setBlockConfirmOpen(false);
        toast.success('Customer has been blocked');
    };

    const handleConfirmUnblock = () => {
        setIsCustomerBlocked(false);
        setUnblockConfirmOpen(false);
        toast.success('Customer has been unblocked');
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div
                className="absolute inset-0 bg-black/20"
                onClick={onClose}
                role="presentation"
            />
            <div
                className="relative flex h-full w-full max-w-[600px] flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-start justify-between border-b border-gray-100 p-5">
                    <div className="min-w-0 space-y-3 pr-2">
                        <h2 className="font-sans text-[22px] font-[700] leading-tight text-[#0F1724]">
                            {displayData.name || 'Customer'}
                        </h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-[#6B7280]">
                                <Phone size={18} className="shrink-0" strokeWidth={2} />
                                <span className="font-sans text-[14px] font-[400] leading-[21px]">
                                    {displayData.phone_number || displayData.phone || '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[#6B7280]">
                                <Mail size={18} className="shrink-0" strokeWidth={2} />
                                <span className="break-all font-sans text-[14px] font-[400] leading-[21px]">
                                    {displayData.email || '—'}
                                </span>
                            </div>
                        </div>
                        <div>
                            {isCustomerBlocked ? (
                                <span className="inline-flex items-center rounded-[8px] bg-gray-200 px-3 py-1.5 font-sans text-[12px] font-medium text-gray-800">
                                    Blocked
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-[8px] bg-primary-bg px-3 py-1.5 font-sans text-[12px] font-medium text-primary">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    {loadingDetails ? (
                        <SkeletonLoader />
                    ) : (
                        <div className="space-y-6 pb-4">
                            <section>
                                <h3 className="mb-3 font-sans text-[16px] font-[700] text-[#0F1724]">
                                    Customer Profile Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-[12px] border border-gray-100 bg-[#F6F8F9] p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[#6B7280]">
                                            <ShoppingBag size={16} strokeWidth={2} />
                                            <span className="font-sans text-[13px] font-medium">Total Orders</span>
                                        </div>
                                        <p className="font-sans text-[20px] font-[800] text-[#0F1724]">
                                            {displayData.total_orders ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-[12px] border border-gray-100 bg-[#F6F8F9] p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[#6B7280]">
                                            <DollarSign size={16} strokeWidth={2} />
                                            <span className="font-sans text-[13px] font-medium">Total Spend</span>
                                        </div>
                                        <p className="font-sans text-[20px] font-[800] text-[#0F1724]">
                                            {formatCurrency(displayData.total_spending ?? 0)}
                                        </p>
                                    </div>
                                    <div className="rounded-[12px] border border-gray-100 bg-[#F6F8F9] p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[#6B7280]">
                                            <Crosshair size={16} strokeWidth={2} />
                                            <span className="font-sans text-[13px] font-medium">Avg Order Value</span>
                                        </div>
                                        <p className="font-sans text-[20px] font-[800] text-[#0F1724]">{avgLabel}</p>
                                    </div>
                                    <div className="rounded-[12px] border border-primary/20 bg-primary-bg p-4">
                                        <div className="mb-2 flex items-center gap-2 text-primary">
                                            <Award size={16} strokeWidth={2} />
                                            <span className="font-sans text-[13px] font-medium">Loyalty Points</span>
                                        </div>
                                        <p className="font-sans text-[20px] font-[800] text-primary">
                                            {displayData.loyalty_points ?? 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-[12px] border border-gray-100 p-4">
                                    <p className="font-sans text-[14px] text-[#6B7280]">
                                        <span className="font-medium text-[#0F1724]">Lifetime Points Earned: </span>
                                        {customerDetails?.lifetime_loyalty_points_earned ?? 0}
                                    </p>
                                    {rewards.length > 0 && (
                                        <div className="mt-3">
                                            <p className="mb-2 font-sans text-[14px] text-[#6B7280]">
                                                Rewards Redeemed:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {rewards.map((reward) => (
                                                    <span
                                                        key={reward.id || reward.title}
                                                        className="rounded-lg bg-primary-bg px-2.5 py-1 font-sans text-[12px] font-medium text-primary"
                                                    >
                                                        {reward.title || reward.reward_type || 'Reward'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {addresses.length > 0 && (
                                <section>
                                    <h3 className="mb-3 font-sans text-[16px] font-[700] text-[#0F1724]">
                                        Delivery Addresses
                                    </h3>
                                    <div className="space-y-2">
                                        {addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                className="flex gap-3 rounded-[12px] border border-gray-100 bg-[#F6F8F9] p-3"
                                            >
                                                <MapPin size={20} className="mt-0.5 shrink-0 text-[#6B7280]" strokeWidth={2} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-sans text-[15px] font-semibold text-[#0F1724]">
                                                        {addr.street}
                                                        {addr.apt_suite ? `, ${addr.apt_suite}` : ''}
                                                    </p>
                                                    <p className="mt-0.5 font-sans text-[13px] text-[#6B7280]">
                                                        {[addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')}
                                                    </p>
                                                    {addr.is_default && (
                                                        <span className="mt-1 inline-block rounded bg-primary-bg px-2 py-0.5 font-sans text-[11px] font-medium text-primary">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="mb-3 font-sans text-[16px] font-[700] text-[#0F1724]">Order History</h3>
                                {orderHistory.length === 0 ? (
                                    <p className="rounded-[12px] border border-dashed border-gray-200 bg-[#F9FAFB] px-4 py-6 text-center font-sans text-[14px] text-[#6B7280]">
                                        No order history in this view yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {orderHistory.map((o) => (
                                            <button
                                                key={o.id || o.order_number}
                                                type="button"
                                                className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-gray-100 bg-white p-3 text-left transition-colors hover:bg-gray-50"
                                                onClick={() => toast('Order details coming soon')}
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-sans text-[15px] font-semibold text-[#0F1724]">
                                                            {o.order_number || o.id}
                                                        </span>
                                                        {o.status && (
                                                            <span className="rounded-md bg-primary-bg px-2 py-0.5 font-sans text-[11px] font-medium text-primary">
                                                                {String(o.status).replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {o.date && (
                                                        <p className="mt-0.5 font-sans text-[13px] text-[#6B7280]">
                                                            {o.date}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {o.total != null && (
                                                        <span className="font-sans text-[20px] font-semibold leading-[30px] text-[#0F1724]">
                                                            {typeof o.total === 'number' ? formatCurrency(o.total) : o.total}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={18} className="text-gray-300" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <h3 className="font-sans text-[16px] font-[700] text-[#0F1724]">
                                        Customer Notes (Internal)
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setAddNoteOpen(true)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-primary px-2.5 py-1.5 font-sans text-[12px] font-medium text-primary transition-colors hover:bg-primary-bg"
                                    >
                                        <Plus size={14} />
                                        Add Note
                                    </button>
                                </div>
                                <div className="rounded-lg border border-amber-200/80 bg-[#FEF9C3] p-3">
                                    <div className="flex gap-2">
                                        <FileText size={18} className="shrink-0 text-amber-800/80" />
                                        <div>
                                            <p className="font-sans text-[14px] font-semibold text-amber-900">
                                                Prefers extra spicy
                                            </p>
                                            <p className="mt-0.5 font-sans text-[13px] text-amber-900/90">
                                                Customer always requests extra chili sauce
                                            </p>
                                            <p className="mt-2 font-sans text-[11px] text-amber-800/70">
                                                Sarah M. • 29 Nov 2025
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 font-sans text-[16px] font-[700] text-[#0F1724]">Account Actions</h3>
                                <div className="space-y-2">
                                    {isCustomerBlocked ? (
                                        <button
                                            type="button"
                                            onClick={() => setUnblockConfirmOpen(true)}
                                            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#D1FAE5] py-3 font-sans text-[14px] font-medium text-[#047857] transition-colors hover:bg-emerald-200/80"
                                        >
                                            <CheckCircle2 size={18} />
                                            Unblock Customer
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setBlockConfirmOpen(true)}
                                            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#FEE2E2] py-3 font-sans text-[14px] font-medium text-[#B91C1C] transition-colors hover:bg-red-100"
                                        >
                                            <Ban size={18} />
                                            Block Customer
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => toast('Export will be available soon')}
                                        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white py-3 font-sans text-[14px] font-medium text-[#374151] transition-colors hover:bg-gray-50"
                                    >
                                        <Download size={18} />
                                        Export Customer Data (CSV)
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Customer Note — z above drawer */}
            {addNoteOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setAddNoteOpen(false)}
                        role="presentation"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-start justify-between gap-2">
                            <h3 className="font-sans text-lg font-[700] text-[#0F1724]">Add Customer Note</h3>
                            <button
                                type="button"
                                onClick={() => setAddNoteOpen(false)}
                                className="rounded-full p-1 text-[#6B7280] hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#0F1724]">
                                    Note Title
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 font-sans text-[14px] text-[#0F1724] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g., Dietary Preference"
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-sans text-[13px] font-medium text-[#0F1724]">
                                    Note Description
                                </label>
                                <textarea
                                    className="min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 font-sans text-[14px] text-[#0F1724] placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Add details about the customer..."
                                    value={noteDescription}
                                    onChange={(e) => setNoteDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setAddNoteOpen(false);
                                    setNoteTitle('');
                                    setNoteDescription('');
                                }}
                                className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 font-sans text-[14px] font-medium text-[#0F1724] transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveNote}
                                className="flex-1 rounded-lg bg-[#F2998F] py-2.5 font-sans text-[14px] font-medium text-white transition-colors hover:opacity-95"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {blockConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setBlockConfirmOpen(false)}
                        role="presentation"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-2 font-sans text-lg font-[700] text-[#0F1724]">Block this customer?</h3>
                        <p className="mb-6 font-sans text-[14px] leading-[21px] text-[#6B7280]">
                            Blocked customers cannot place new orders. They will be notified that their account has been
                            restricted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setBlockConfirmOpen(false)}
                                className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 font-sans text-[14px] font-medium text-[#0F1724] transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBlock}
                                className="flex-1 rounded-lg bg-[#DC2626] py-2.5 font-sans text-[14px] font-medium text-white transition-colors hover:bg-red-700"
                            >
                                Block
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {unblockConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setUnblockConfirmOpen(false)}
                        role="presentation"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-2 font-sans text-lg font-[700] text-[#0F1724]">Unblock this customer?</h3>
                        <p className="mb-6 font-sans text-[14px] leading-[21px] text-[#6B7280]">
                            This customer will be able to place orders again. They will be notified that their account has
                            been reactivated.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setUnblockConfirmOpen(false)}
                                className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 font-sans text-[14px] font-medium text-[#0F1724] transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUnblock}
                                className="flex-1 rounded-lg bg-[#10B981] py-2.5 font-sans text-[14px] font-medium text-white transition-colors hover:bg-emerald-600"
                            >
                                Unblock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
