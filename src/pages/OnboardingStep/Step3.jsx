import { ChevronDown, ChevronLeft, ChevronRight, Edit2, Image, Plus, Trash2, X } from 'lucide-react';

import Toggle from './Toggle';

export default function Step3({
    categories,
    items,
    editingCategoryId,
    formData,
    setFormData,
    categoryImage,
    categoryImagePreviewUrl,
    setCategoryImageFile,
    CATEGORY_IMAGE_REQUIRED_PX,
    saveCategory,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
    handlePrev,
    handleNext,
    showAddItemModal,
    setShowAddItemModal,
    closeAddItemModal,
    itemForm,
    setItemForm,
    itemImagePreviewUrl,
    setItemImageFile,
    saveItem,
}) {
    const editingCategory = categories.find((c) => c.id === editingCategoryId) || null;
    const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
    const canSaveCategory = formData.categoryName.trim() && (editingCategoryId ? true : !!categoryImage);
    const canOpenAddItem = categories.length > 0;
    const canSaveItem = itemForm.categoryId && itemForm.name.trim() && itemForm.price.trim();
    const tagOptions = ['Vegan', 'Spicy', 'Halal', 'Gluten-Free', 'Popular'];

    return (
        <div className="space-y-8">
            <div className="bg-[#F9FAFB]/50 rounded-[20px] border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-[16px] font-[400] text-[#1A1A1A]">Add Menu Categories</h3>
                    {editingCategoryId && (
                        <button type="button" onClick={resetCategoryForm} className="text-[13px] text-[#6B7280] font-[500] hover:underline">
                            Cancel edit
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-end justify-between gap-3 mb-1.5">
                            <label className="block text-[14px] font-[500] text-[#1A1A1A]">Image</label>
                            <span className="text-[11px] text-[#6B7280] font-[400]">
                                Required: {CATEGORY_IMAGE_REQUIRED_PX.width}×{CATEGORY_IMAGE_REQUIRED_PX.height}px
                            </span>
                        </div>
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-[14px] h-[52px] flex items-center px-4 justify-between">
                            <label htmlFor="categoryImageUpload" className="flex items-center gap-2 text-[13px] font-[500] text-[#6B7280] cursor-pointer">
                                <Image size={18} />
                                {categoryImage ? 'Change image' : 'Upload image'}
                            </label>
                            <span className="text-[12px] text-[#9CA3AF] font-[400] max-w-[220px] truncate">
                                {categoryImage?.name ?? editingCategory?.imageName ?? 'No file chosen'}
                            </span>
                            <input
                                id="categoryImageUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCategoryImageFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {categoryImagePreviewUrl && (
                            <div className="w-full h-[140px] rounded-[16px] overflow-hidden border border-[#E5E7EB] bg-white mt-2">
                                <img src={categoryImagePreviewUrl} alt="Category Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            value={formData.categoryName}
                            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                            className="onboarding-input h-11"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-[500] text-[#1A1A1A] mb-1.5">Description (optional)</label>
                        <input
                            type="text"
                            placeholder="Brief description of this category"
                            value={formData.categoryDesc}
                            onChange={(e) => setFormData({ ...formData, categoryDesc: e.target.value })}
                            className="onboarding-input h-11"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[13px]">
                            <p className="text-[14px] font-[500] text-[#1A1A1A]">Category Visibility</p>
                            <p className="text-[12px] mt-1 text-[#6B6B6B]">Show this category to customers</p>
                        </div>
                        <Toggle active={formData.categoryVisible} onClick={() => setFormData({ ...formData, categoryVisible: !formData.categoryVisible })} />
                    </div>
                    <button
                        type="button"
                        disabled={!canSaveCategory}
                        onClick={saveCategory}
                        className={`w-full h-11 rounded-[8px] text-[16px] flex items-center justify-center gap-2 ${canSaveCategory ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#6B6B6B]'}`}
                    >
                        <Plus size={18} /> {editingCategoryId ? 'Update Category' : 'Add Category'}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] text-[#1A1A1A]">Categories ({categories.length})</h3>
                </div>
                {categories.length === 0 ? (
                    <div className="py-10 text-center text-[#6B7280] text-[13px]">
                        No categories added yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-start justify-between gap-4 p-4 bg-[#F6F8F9]/50 rounded-[12px] border border-[#E5E7EB]">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{category.name}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-[999px] ${category.visible ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                            {category.visible ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    {category.description ? (
                                        <p className="text-[12px] text-[#6B7280] mt-1">{category.description}</p>
                                    ) : null}
                                    {category.imageName ? (
                                        <p className="text-[11px] text-[#9CA3AF] mt-2 truncate">Image: {category.imageName}</p>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" onClick={() => startEditCategory(category)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                    <button type="button" onClick={() => deleteCategory(category.id)} className="p-2 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} className="text-[#EF4444]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-[#F9FAFB]/50 rounded-[20px] border border-gray-100 p-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-[400] text-[#1A1A1A]">Add Item</h3>
                    <button
                        type="button"
                        disabled={!canOpenAddItem}
                        onClick={() => setShowAddItemModal(true)}
                        className={`h-11 px-4 rounded-[10px] text-[14px] font-[500] flex items-center gap-2 ${canOpenAddItem ? 'bg-primary text-white' : 'bg-[#E5E7EB] text-[#6B6B6B]'}`}
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
                {!canOpenAddItem && (
                    <p className="text-[12px] text-[#6B7280] mt-2">Add at least one category before adding items</p>
                )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] text-[#1A1A1A]">Items ({items.length})</h3>
                </div>
                {items.length === 0 ? (
                    <div className="py-10 text-center text-[#6B7280] text-[13px]">
                        No items added yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => {
                            const categoryName = categories.find((c) => c.id === item.categoryId)?.name || '—';
                            return (
                                <div key={item.id} className="p-4 bg-[#F6F8F9]/50 rounded-[12px] border border-[#E5E7EB]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[600] text-[#1A1A1A] truncate">{item.name}</p>
                                            <p className="text-[12px] text-[#6B7280] mt-1">{categoryName} • ${item.price}</p>
                                            {item.tags?.length ? (
                                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                                    {item.tags.map((t) => (
                                                        <span key={t} className="text-[10px] px-3 py-0.5 rounded-[999px] bg-white border border-gray-200 text-[#6B7280]">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`text-[10px] px-3 py-1 rounded-[999px] ${item.available ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                                                {item.available ? 'Available' : 'Unavailable'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-between">
                <button type="button" onClick={handlePrev} className="prev-btn flex items-center gap-2 px-10">
                    <ChevronLeft size={18} /> Previous
                </button>
                <button type="button" onClick={handleNext} className="next-btn bg-primary text-white px-10">
                    Next <ChevronRight size={18} />
                </button>
            </div>

            {showAddItemModal && (
                <div className="fixed inset-0 z-[120]">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeAddItemModal} />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-[900px] rounded-[24px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-[22px] font-bold text-[#1A1A1A]">
                                    {itemForm.categoryId ? `Add Item to ${categories.find((c) => c.id === itemForm.categoryId)?.name || 'Category'}` : 'Add Item'}
                                </h2>
                                <button onClick={closeAddItemModal} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Item Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Classic Cheeseburger"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Price <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="12.99"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Category <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={itemForm.categoryId}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px] appearance-none"
                                        >
                                            <option value="">Select category</option>
                                            {categoryOptions.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Item Image</label>
                                    <label
                                        htmlFor="itemImageUpload"
                                        className="w-full h-[240px] rounded-[16px] border-2 border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                                    >
                                        {itemImagePreviewUrl ? (
                                            <img src={itemImagePreviewUrl} alt="Item preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-[#6B7280] gap-3">
                                                <div className="w-[44px] h-[44px] rounded-[12px] bg-[#F6F8F9] flex items-center justify-center">
                                                    <Image size={22} className="text-[#6B7280]" />
                                                </div>
                                                <p className="text-[16px] font-[500]">Click to upload image</p>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id="itemImageUpload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setItemImageFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-[600] text-[#1A1A1A]">Description</label>
                                    <textarea
                                        placeholder="Describe your item..."
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="onboarding-input !h-[120px] !rounded-[12px] py-4 resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-[16px] font-[700] text-[#1A1A1A]">Add-ons (Optional)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setItemForm((prev) => ({ ...prev, addOns: [...prev.addOns, { name: '', price: '' }] }))}
                                            className="h-[40px] px-4 border border-[#24B99E] text-primary rounded-[10px] text-[14px] flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Add Add-on
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {itemForm.addOns.map((addOn, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Add-on name"
                                                    value={addOn.name}
                                                    onChange={(e) => setItemForm((prev) => ({
                                                        ...prev,
                                                        addOns: prev.addOns.map((a, i) => (i === idx ? { ...a, name: e.target.value } : a)),
                                                    }))}
                                                    className="onboarding-input !h-[52px] !rounded-[12px] col-span-7"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Price"
                                                    value={addOn.price}
                                                    onChange={(e) => setItemForm((prev) => ({
                                                        ...prev,
                                                        addOns: prev.addOns.map((a, i) => (i === idx ? { ...a, price: e.target.value } : a)),
                                                    }))}
                                                    className="onboarding-input !h-[52px] !rounded-[12px] col-span-4"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setItemForm((prev) => ({
                                                        ...prev,
                                                        addOns: prev.addOns.length === 1 ? prev.addOns : prev.addOns.filter((_, i) => i !== idx),
                                                    }))}
                                                    className="col-span-1 flex items-center justify-center h-[52px] rounded-[12px] hover:bg-red-50"
                                                >
                                                    <Trash2 size={18} className="text-[#EF4444]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[16px] font-[700] text-[#1A1A1A]">Tags</h3>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {tagOptions.map((tag) => {
                                            const active = itemForm.tags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => setItemForm((prev) => ({
                                                        ...prev,
                                                        tags: active ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
                                                    }))}
                                                    className={`h-[40px] px-4 rounded-[999px] border text-[14px] ${active ? 'bg-[#E6F7F4] border-primary text-primary' : 'bg-white border-gray-200 text-[#6B7280]'}`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <label className="block text-[14px] font-[600] text-[#1A1A1A]">Prep Time (minutes)</label>
                                        <input
                                            type="text"
                                            value={itemForm.prepTimeMinutes}
                                            onChange={(e) => setItemForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))}
                                            className="onboarding-input !h-[56px] !rounded-[12px]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-6 pt-6">
                                        <div>
                                            <p className="text-[14px] font-[600] text-[#1A1A1A]">Availability</p>
                                            <p className="text-[12px] text-[#6B7280] mt-1">{itemForm.available ? 'Available' : 'Unavailable'}</p>
                                        </div>
                                        <Toggle active={itemForm.available} onClick={() => setItemForm((prev) => ({ ...prev, available: !prev.available }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeAddItemModal}
                                    className="h-[52px] px-8 border border-gray-200 text-[#1A1A1A] font-[600] rounded-[12px] hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!canSaveItem}
                                    onClick={saveItem}
                                    className={`h-[52px] px-8 font-[600] rounded-[12px] transition-colors ${canSaveItem ? 'bg-primary text-white hover:bg-[#1da88f]' : 'bg-[#E5E7EB] text-[#9CA3AF]'}`}
                                >
                                    Save Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
