import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const getInitialFormData = (reward, mode) => {
    if (reward && (mode === 'edit' || mode === 'reactivate')) {
        const { reward_image, reward_emoji } = getRewardImageFromApi(reward);
        return {
            reward_name: reward.reward_name || reward.name || '',
            points_required: reward.points_required || reward.points || '',
            menu_item_id: reward.menu_item_id || reward.linked_item || reward.menuItemId || '',
            description: reward.description || '',
            reward_image,
            reward_emoji,
            is_active: mode === 'edit' ? reward.is_active || reward.status === 'Active' : false,
            reward_type: typeof reward.reward_type === 'string' ? reward.reward_type : '',
            reward_value: reward.reward_value ?? '',
            // Convert ISO string from API to datetime-local input format
            valid_until: reward.valid_until ? reward.valid_until.slice(0, 16) : '',
        };
    }

    return {
        reward_name: '',
        points_required: '',
        menu_item_id: '',
        description: '',
        reward_image: '',
        reward_emoji: '',
        is_active: true,
        reward_type: '',
        reward_value: '',
        valid_until: '',
    };
};

const MAX_REWARD_IMAGE_BYTES = 1.5 * 1024 * 1024;

const isImageUrlValue = (v) => {
    if (typeof v !== 'string' || !v) return false;
    return v.startsWith('data:image/') || /^https?:\/\//i.test(v);
};

const getRewardImageFromApi = (reward) => {
    const raw = (reward && (reward.reward_image || reward.image)) || '';
    if (isImageUrlValue(raw) || (typeof raw === 'string' && /^https?:\/\//i.test(raw))) {
        return { reward_image: raw, reward_emoji: '' };
    }
    return { reward_image: '', reward_emoji: raw || '' };
};

const RewardModalInner = ({
    onClose,
    reward,
    mode,
    menuItems = [],
    categories = [],
    loadingMenuItems = false,
    rewardTypes = [],
    loadingRewardTypes = false,
    onSave
}) => {
    const [formData, setFormData] = useState(() => getInitialFormData(reward, mode));
    const [submitting, setSubmitting] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const imageFileInputRef = useRef(null);

    const title = mode === 'add' ? 'Add Reward Item' : mode === 'edit' ? 'Edit Reward Item' : 'Reactivate Reward Item';
    const buttonText = submitting ? 'Saving...' : (mode === 'add' ? 'Save Reward' : 'Save Changes');

    const selectedTypeConfig = Array.isArray(rewardTypes)
        ? rewardTypes.find((t) => t.reward_type === formData.reward_type)
        : null;

    const isFreeItem = formData.reward_type === 'free_item';
    const isRewardValueRequired = !!selectedTypeConfig?.reward_value_required;

    const handleRewardImageFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file (PNG, JPG, etc.).');
            return;
        }
        if (file.size > MAX_REWARD_IMAGE_BYTES) {
            toast.error('Image is too large. Please use a file under 1.5 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                reward_image: String(reader.result || ''),
                reward_emoji: '',
            }));
        };
        reader.onerror = () => toast.error('Could not read that file.');
        reader.readAsDataURL(file);
    };

    const clearRewardImage = () => {
        setFormData((prev) => ({ ...prev, reward_image: '' }));
        if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    };

    const canShowRemoveImage = () =>
        Boolean(
            (formData.reward_image && (isImageUrlValue(formData.reward_image) || /^https?:\/\//i.test(formData.reward_image)))
        );

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Normalize valid_until to ISO string expected by backend
            // Basic front-end validation using reward types definition
            if (!formData.reward_type) {
                alert('Please select a reward type.');
                setSubmitting(false);
                return;
            }

            if (isFreeItem && !formData.menu_item_id) {
                alert('Please select a menu item for a Free Item reward.');
                setSubmitting(false);
                return;
            }

            if (isRewardValueRequired) {
                const valueNum = Number(formData.reward_value);
                if (!Number.isFinite(valueNum) || valueNum <= 0) {
                    alert('Please enter a valid reward value for this reward type.');
                    setSubmitting(false);
                    return;
                }
            }

            const mergedRewardImage = (() => {
                const img = String(formData.reward_image || '');
                if (isImageUrlValue(img) || /^https?:\/\//i.test(img)) return img;
                return String(formData.reward_emoji || '');
            })();
            const formWithoutEmoji = { ...formData };
            delete formWithoutEmoji.reward_emoji;
            const payload = {
                ...formWithoutEmoji,
                reward_image: mergedRewardImage,
                valid_until: formData.valid_until
                    ? new Date(formData.valid_until).toISOString()
                    : null,
            };
            if (onSave) {
                await onSave(payload);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Initialize selected category if editing an existing reward
    React.useEffect(() => {
        if (!formData.menu_item_id || !Array.isArray(categories) || categories.length === 0) return;
        for (const cat of categories) {
            if (Array.isArray(cat.dishes) && cat.dishes.some(d => String(d.id) === String(formData.menu_item_id))) {
                setSelectedCategoryId(cat.id);
                return;
            }
        }
    }, [formData.menu_item_id, categories]);

    const itemsForCategory = selectedCategoryId && Array.isArray(categories)
        ? (categories.find(c => String(c.id) === String(selectedCategoryId))?.dishes || [])
        : [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-general-text">{title}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Reward Type (top) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reward Type</label>
                        <select
                            value={formData.reward_type}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    reward_type: value,
                                    // Clear menu item if switching away from free_item
                                    ...(value !== 'free_item' ? { menu_item_id: '' } : {}),
                                }));
                                if (value !== 'free_item') {
                                    setSelectedCategoryId('');
                                }
                            }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                            disabled={loadingRewardTypes}
                        >
                            <option value="">{loadingRewardTypes ? 'Loading types...' : 'Select reward type'}</option>
                            {Array.isArray(rewardTypes) && rewardTypes.map((type) => (
                                <option key={type.reward_type} value={type.reward_type}>
                                    {type.label || type.reward_type}
                                </option>
                            ))}
                        </select>
                        {selectedTypeConfig?.description && (
                            <p className="mt-1 text-xs text-gray-500">
                                {selectedTypeConfig.description}
                            </p>
                        )}
                    </div>

                    {/* Reward Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reward Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Free Ice Cream"
                            value={formData.reward_name}
                            onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Points Required */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Points Required</label>
                        <input
                            type="number"
                            placeholder="e.g., 175"
                            value={formData.points_required}
                            onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Choose Category & Menu Item (only for free_item type) */}
                    {isFreeItem && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Choose Category</label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => {
                                        setSelectedCategoryId(e.target.value);
                                        setFormData({ ...formData, menu_item_id: '' });
                                    }}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    disabled={loadingMenuItems}
                                >
                                    <option value="">{loadingMenuItems ? 'Loading categories...' : 'Select a category'}</option>
                                    {Array.isArray(categories) && categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Choose Menu Item</label>
                                <select
                                    value={formData.menu_item_id}
                                    onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    disabled={loadingMenuItems || !selectedCategoryId}
                                >
                                    <option value="">{loadingMenuItems ? 'Loading items...' : (selectedCategoryId ? 'Select an item' : 'Select a category first')}</option>
                                    {itemsForCategory && itemsForCategory.length > 0 && itemsForCategory.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <textarea
                            rows="3"
                            placeholder="Brief description of the reward"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Reward image: click box to upload, emoji field beside */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-0.5">Reward image (optional)</label>
                        <p className="text-xs text-gray-500 mb-2.5">Click the box to upload, or add an emoji in the field</p>
                        <input
                            ref={imageFileInputRef}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleRewardImageFile}
                        />
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    onClick={() => imageFileInputRef.current?.click()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            imageFileInputRef.current?.click();
                                        }
                                    }}
                                    className="group h-20 w-20 cursor-pointer overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-left transition-colors hover:border-primary/50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    title="Click to upload image"
                                    aria-label="Upload reward image"
                                >
                                    {isImageUrlValue(formData.reward_image) || /^https?:\/\//i.test(String(formData.reward_image || '')) ? (
                                        <img
                                            src={formData.reward_image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : formData.reward_emoji ? (
                                        <span className="flex h-full w-full select-none items-center justify-center text-3xl" role="img" aria-hidden>
                                            {formData.reward_emoji}
                                        </span>
                                    ) : (
                                        <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-[10px] font-medium leading-tight text-gray-400 group-hover:text-gray-500">
                                            <ImageIcon className="mx-auto h-7 w-7 text-gray-300 group-hover:text-gray-400" />
                                        </span>
                                    )}
                                </button>
                                {canShowRemoveImage() && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearRewardImage();
                                        }}
                                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] font-bold text-gray-500 shadow-sm hover:bg-gray-50"
                                        title="Remove image"
                                        aria-label="Remove image"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 flex items-center">
                                <input
                                    id="reward-emoji"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    placeholder=""
                                    value={formData.reward_emoji}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, reward_emoji: e.target.value }))}
                                    className="w-full h-11 min-h-0 px-4 py-2 bg-white border border-gray-200 rounded-xl text-lg leading-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Valid Until */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid Until</label>
                        <input
                            type="datetime-local"
                            value={formData.valid_until}
                            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Reward Value */}
                    {formData.reward_type && !isFreeItem && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reward Value</label>
                            <input
                                type="number"
                                placeholder="e.g., 10"
                                value={formData.reward_value}
                                onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.reward_type === 'discount' &&
                                    '0–100 = % off (10 = 10%), >100 = $ off (15 = $15 off).'}
                                {formData.reward_type === 'free_delivery' &&
                                    'Max delivery fee to waive (e.g. 5.99).'}
                                {formData.reward_type === 'cash_credit' &&
                                    'Dollar amount off order (e.g. 5 = $5 off).'}
                            </p>
                        </div>
                    )}

                    {/* Status Toggle */}
                    <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-general-text">Make this reward active</p>
                            <p className="text-xs text-gray-400">Customers can immediately redeem this reward</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RewardModal = ({
    isOpen,
    onClose,
    reward,
    mode = 'add',
    onSave,
    menuItems = [],
    categories = [],
    loadingMenuItems = false,
    rewardTypes = [],
    loadingRewardTypes = false,
}) => {
    if (!isOpen) return null;

    const modalKey = `${mode}-${reward?.reward_name || reward?.name || ''}-${reward?.points_required || reward?.points || ''}-${reward?.is_active || reward?.status || ''}-${reward?.linked_item || reward?.linkedItem || ''}`;

    return (
        <RewardModalInner
            key={modalKey}
            onClose={onClose}
            reward={reward}
            mode={mode}
            onSave={onSave}
            menuItems={menuItems}
            categories={categories}
            loadingMenuItems={loadingMenuItems}
            rewardTypes={rewardTypes}
            loadingRewardTypes={loadingRewardTypes}
        />
    );
};

export default RewardModal;
