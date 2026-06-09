import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { makeClientId, formatAddonPrice } from '../../utils/addonCategories';

const emptyCategoryDraft = () => ({
    name: '',
    allowMultiple: true,
    addonName: '',
    addonPrice: '',
});

const emptyAddonDraft = () => ({
    name: '',
    price: '',
    image: '',
});

export default function AddonCategoriesSection({
    addonCategories,
    onChange,
    disabled = false,
    onUploadImage,
}) {
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [addonModalOpen, setAddonModalOpen] = useState(false);
    const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
    const [addonDraft, setAddonDraft] = useState(emptyAddonDraft);
    const [targetCategoryClientId, setTargetCategoryClientId] = useState('');
    const [editingAddon, setEditingAddon] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [modalError, setModalError] = useState('');

    const sortedCategories = [...(Array.isArray(addonCategories) ? addonCategories : [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

    const closeCategoryModal = () => {
        setCategoryModalOpen(false);
        setCategoryDraft(emptyCategoryDraft());
        setModalError('');
    };

    const closeAddonModal = () => {
        setAddonModalOpen(false);
        setAddonDraft(emptyAddonDraft());
        setTargetCategoryClientId('');
        setEditingAddon(null);
        setModalError('');
    };

    const openNewCategoryModal = () => {
        if (disabled) return;
        setCategoryDraft(emptyCategoryDraft());
        setModalError('');
        setCategoryModalOpen(true);
    };

    const confirmNewCategory = () => {
        const name = categoryDraft.name.trim();
        const addonName = categoryDraft.addonName.trim();
        const price = Number(categoryDraft.addonPrice);
        if (!name) {
            setModalError('Category name is required');
            return;
        }
        if (!addonName) {
            setModalError('First add-on name is required');
            return;
        }
        if (!Number.isFinite(price)) {
            setModalError('Add-on price must be a number');
            return;
        }

        onChange([
            ...addonCategories,
            {
                clientId: makeClientId(),
                name,
                sort_order: addonCategories.length,
                is_multiple_allowed: categoryDraft.allowMultiple,
                addons: [
                    {
                        clientId: makeClientId(),
                        name: addonName,
                        price,
                        image: null,
                    },
                ],
            },
        ]);
        closeCategoryModal();
    };

    const openAddAddonModal = (categoryClientId) => {
        if (disabled) return;
        setTargetCategoryClientId(categoryClientId);
        setEditingAddon(null);
        setAddonDraft(emptyAddonDraft());
        setModalError('');
        setAddonModalOpen(true);
    };

    const openEditAddonModal = (categoryClientId, addon) => {
        if (disabled) return;
        setTargetCategoryClientId(categoryClientId);
        setEditingAddon({ categoryClientId, addonClientId: addon.clientId });
        setAddonDraft({
            name: addon.name || '',
            price: addon.price === 0 || addon.price ? String(addon.price) : '',
            image: addon.image || '',
        });
        setModalError('');
        setAddonModalOpen(true);
    };

    const confirmAddonModal = () => {
        const name = addonDraft.name.trim();
        const price = Number(addonDraft.price);
        if (!name) {
            setModalError('Add-on name is required');
            return;
        }
        if (!Number.isFinite(price)) {
            setModalError('Add-on price must be a number');
            return;
        }

        onChange(
            addonCategories.map((cat) => {
                if (cat.clientId !== targetCategoryClientId) return cat;
                if (editingAddon) {
                    return {
                        ...cat,
                        addons: cat.addons.map((addon) =>
                            addon.clientId === editingAddon.addonClientId
                                ? { ...addon, name, price, image: addonDraft.image?.trim() || null }
                                : addon,
                        ),
                    };
                }
                return {
                    ...cat,
                    addons: [
                        ...cat.addons,
                        {
                            clientId: makeClientId(),
                            name,
                            price,
                            image: addonDraft.image?.trim() || null,
                        },
                    ],
                };
            }),
        );
        closeAddonModal();
    };

    const removeCategory = (categoryClientId) => {
        if (disabled) return;
        onChange(addonCategories.filter((cat) => cat.clientId !== categoryClientId));
    };

    const removeAddon = (categoryClientId, addonClientId) => {
        if (disabled) return;
        onChange(
            addonCategories
                .map((cat) => {
                    if (cat.clientId !== categoryClientId) return cat;
                    return { ...cat, addons: cat.addons.filter((addon) => addon.clientId !== addonClientId) };
                })
                .filter((cat) => cat.addons.length > 0),
        );
    };

    const handleAddonImageUpload = async (file) => {
        if (!file || !onUploadImage) return;
        setUploadingImage(true);
        setModalError('');
        try {
            const url = await onUploadImage(file);
            setAddonDraft((prev) => ({ ...prev, image: url }));
        } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : 'Image upload failed';
            setModalError(message);
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <label className="text-[14px] font-[500] text-[#374151]">Add-ons (Modifiers)</label>
                <button
                    type="button"
                    onClick={openNewCategoryModal}
                    disabled={disabled}
                    className="flex items-center gap-1 text-[13px] font-medium text-[#DD2F26] hover:opacity-80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={14} /> Add new
                </button>
            </div>

            {sortedCategories.length === 0 ? (
                <p className="text-[12px] text-gray-500">No add-on categories yet. Use &quot;Add new&quot; to create one.</p>
            ) : (
                <div className="space-y-3">
                    {sortedCategories.map((category) => (
                        <div key={category.clientId} className="border border-[#E5E7EB] rounded-[10px] overflow-hidden bg-white">
                            <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#111827] truncate">
                                        {category.name || 'Unnamed category'}
                                        <span className="ml-2 text-[11px] font-medium text-gray-500">
                                            ({category.is_multiple_allowed ? 'multiple' : 'pick one'})
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => openAddAddonModal(category.clientId)}
                                        disabled={disabled}
                                        className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-[#DD2F26] hover:bg-[#FEF2F2] rounded-[6px] transition-colors disabled:opacity-50"
                                    >
                                        <Plus size={12} /> Add add-on
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(category.clientId)}
                                        disabled={disabled}
                                        className="p-1.5 text-gray-400 hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors disabled:opacity-50"
                                        aria-label="Delete category"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-[#F3F4F6]">
                                {category.addons.map((addon) => (
                                    <div key={addon.clientId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-[13px] text-[#374151] truncate">
                                                {addon.name || 'Unnamed add-on'}
                                                <span className="text-gray-500"> — {formatAddonPrice(addon.price)}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openEditAddonModal(category.clientId, addon)}
                                                disabled={disabled}
                                                className="p-1.5 text-gray-400 hover:text-[#DD2F26] hover:bg-[#FEF2F2] rounded-[6px] transition-colors disabled:opacity-50"
                                                aria-label="Edit add-on"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeAddon(category.clientId, addon.clientId)}
                                                disabled={disabled}
                                                className="p-1.5 text-gray-400 hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors disabled:opacity-50"
                                                aria-label="Delete add-on"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {sortedCategories.length > 0 && (
                <button
                    type="button"
                    onClick={openNewCategoryModal}
                    disabled={disabled}
                    className="flex items-center gap-1 text-[13px] font-medium text-[#DD2F26] hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Plus size={14} /> Add new category
                </button>
            )}

            {categoryModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" onClick={closeCategoryModal}>
                    <div
                        className="bg-white rounded-[12px] w-full max-w-[420px] shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#111827]">Add category</h3>
                            <button type="button" onClick={closeCategoryModal} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {!!modalError && (
                                <div className="bg-[#FEE2E2] text-[#991B1B] text-[12px] px-3 py-2 rounded-[8px]">{modalError}</div>
                            )}
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                    Category name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Toppings"
                                    value={categoryDraft.name}
                                    onChange={(e) => setCategoryDraft((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-2">Selection type</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={categoryDraft.allowMultiple}
                                            onChange={() => setCategoryDraft((prev) => ({ ...prev, allowMultiple: true }))}
                                        />
                                        Multiple allowed
                                    </label>
                                    <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!categoryDraft.allowMultiple}
                                            onChange={() => setCategoryDraft((prev) => ({ ...prev, allowMultiple: false }))}
                                        />
                                        Pick one only
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                    First add-on name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Extra Cheese"
                                    value={categoryDraft.addonName}
                                    onChange={(e) => setCategoryDraft((prev) => ({ ...prev, addonName: e.target.value }))}
                                    className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                    First add-on price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={categoryDraft.addonPrice}
                                        onChange={(e) => setCategoryDraft((prev) => ({ ...prev, addonPrice: e.target.value }))}
                                        className="w-full h-[40px] pl-7 pr-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeCategoryModal}
                                className="px-4 py-2 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmNewCategory}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-[#DD2F26] rounded-[8px] hover:bg-[#C52820]"
                            >
                                Add category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addonModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" onClick={closeAddonModal}>
                    <div
                        className="bg-white rounded-[12px] w-full max-w-[420px] shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#111827]">{editingAddon ? 'Edit add-on' : 'Add add-on'}</h3>
                            <button type="button" onClick={closeAddonModal} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {!!modalError && (
                                <div className="bg-[#FEE2E2] text-[#991B1B] text-[12px] px-3 py-2 rounded-[8px]">{modalError}</div>
                            )}
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                    Add-on name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Add-on name"
                                    value={addonDraft.name}
                                    onChange={(e) => setAddonDraft((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                    Price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={addonDraft.price}
                                        onChange={(e) => setAddonDraft((prev) => ({ ...prev, price: e.target.value }))}
                                        className="w-full h-[40px] pl-7 pr-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Image (optional)</label>
                                {onUploadImage ? (
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingImage}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) void handleAddonImageUpload(file);
                                                e.target.value = '';
                                            }}
                                            className="block w-full text-[12px] text-gray-500"
                                        />
                                        {uploadingImage && <p className="text-[12px] text-gray-500">Uploading...</p>}
                                        {addonDraft.image && (
                                            <p className="text-[12px] text-gray-500 truncate">Image URL set</p>
                                        )}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Image URL"
                                        value={addonDraft.image}
                                        onChange={(e) => setAddonDraft((prev) => ({ ...prev, image: e.target.value }))}
                                        className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none focus:border-[#DD2F26]"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeAddonModal}
                                className="px-4 py-2 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmAddonModal}
                                disabled={uploadingImage}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-[#DD2F26] rounded-[8px] hover:bg-[#C52820] disabled:opacity-50"
                            >
                                {editingAddon ? 'Save' : 'Add add-on'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
