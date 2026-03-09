import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

const getInitialFormData = (reward, mode) => {
    if (reward && (mode === 'edit' || mode === 'reactivate')) {
        return {
            reward_name: reward.reward_name || reward.name || '',
            points_required: reward.points_required || reward.points || '',
            menu_item_id: reward.menu_item_id || reward.linked_item || reward.menuItemId || '',
            description: reward.description || '',
            reward_image: reward.reward_image || reward.image || '',
            is_active: mode === 'edit' ? reward.is_active || reward.status === 'Active' : false,
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
        is_active: true,
        valid_until: '',
    };
};

const RewardModalInner = ({ onClose, reward, mode, menuItems = [], categories = [], loadingMenuItems = false, onSave }) => {
    const [formData, setFormData] = useState(() => getInitialFormData(reward, mode));
    const [submitting, setSubmitting] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const title = mode === 'add' ? 'Add Reward Item' : mode === 'edit' ? 'Edit Reward Item' : 'Reactivate Reward Item';
    const buttonText = submitting ? 'Saving...' : (mode === 'add' ? 'Save Reward' : 'Save Changes');

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Normalize valid_until to ISO string expected by backend
            const payload = {
                ...formData,
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
                    {/* Reward Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reward Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Free Ice Cream"
                            value={formData.reward_name}
                            onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Choose Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Choose Category</label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => {
                                setSelectedCategoryId(e.target.value);
                                setFormData({ ...formData, menu_item_id: '' });
                            }}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                            disabled={loadingMenuItems}
                        >
                            <option value="">{loadingMenuItems ? 'Loading categories...' : 'Select a category'}</option>
                            {Array.isArray(categories) && categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Choose Menu Item */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Choose Menu Item</label>
                        <select
                            value={formData.menu_item_id}
                            onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                            disabled={loadingMenuItems || !selectedCategoryId}
                        >
                            <option value="">{loadingMenuItems ? 'Loading items...' : (selectedCategoryId ? 'Select an item' : 'Select a category first')}</option>
                            {itemsForCategory && itemsForCategory.length > 0 && itemsForCategory.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <textarea
                            rows="3"
                            placeholder="Brief description of the reward"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Reward Image (Emoji) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reward Image (Emoji)</label>
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-2xl">
                                {formData.reward_image || <ImageIcon className="w-6 h-6 text-gray-300" />}
                            </div>
                            <input
                                type="text"
                                placeholder="Paste emoji or icon"
                                value={formData.reward_image}
                                onChange={(e) => setFormData({ ...formData, reward_image: e.target.value })}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Valid Until */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid Until</label>
                        <input
                            type="datetime-local"
                            value={formData.valid_until}
                            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

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
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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

const RewardModal = ({ isOpen, onClose, reward, mode = 'add', onSave, menuItems = [], categories = [], loadingMenuItems = false }) => {
    if (!isOpen) return null;

    const modalKey = `${mode}-${reward?.reward_name || reward?.name || ''}-${reward?.points_required || reward?.points || ''}-${reward?.is_active || reward?.status || ''}-${reward?.linked_item || reward?.linkedItem || ''}`;

    return <RewardModalInner key={modalKey} onClose={onClose} reward={reward} mode={mode} onSave={onSave} menuItems={menuItems} categories={categories} loadingMenuItems={loadingMenuItems} />;
};

export default RewardModal;
