import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

const getInitialFormData = (reward, mode) => {
    if (reward && (mode === 'edit' || mode === 'reactivate')) {
        return {
            name: reward.name || '',
            points: reward.points || '',
            menuItem: reward.linkedItem || '',
            description: reward.description || '',
            emoji: reward.image || '',
            isActive: mode === 'edit' ? reward.status === 'Active' : false,
        };
    }

    return {
        name: '',
        points: '',
        menuItem: '',
        description: '',
        emoji: '',
        isActive: true,
    };
};

const RewardModalInner = ({ onClose, reward, mode }) => {
    const [formData, setFormData] = useState(() => getInitialFormData(reward, mode));

    const title = mode === 'add' ? 'Add Reward Item' : mode === 'edit' ? 'Edit Reward Item' : 'Reactivate Reward Item';
    const buttonText = mode === 'add' ? 'Save Reward' : 'Save Changes';

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
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Points Required */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Points Required</label>
                        <input
                            type="number"
                            placeholder="e.g., 175"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Choose Menu Item */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Choose Menu Item</label>
                        <select
                            value={formData.menuItem}
                            onChange={(e) => setFormData({ ...formData, menuItem: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                        >
                            <option value="">Select an item</option>
                            <option value="Ice Cream Cone">Ice Cream Cone</option>
                            <option value="French Fries (Regular)">French Fries (Regular)</option>
                            <option value="Soft Drink (Any Size)">Soft Drink (Any Size)</option>
                            <option value="Cheeseburger">Cheeseburger</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Cookie">Cookie</option>
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
                                {formData.emoji || <ImageIcon className="w-6 h-6 text-gray-300" />}
                            </div>
                            <input
                                type="text"
                                placeholder="Paste emoji or icon"
                                value={formData.emoji}
                                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
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
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
                        onClick={() => {
                            // In a real app, we'd call a save function here
                            onClose();
                        }}
                        className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RewardModal = ({ isOpen, onClose, reward, mode = 'add' }) => {
    if (!isOpen) return null;

    const modalKey = `${mode}-${reward?.name || ''}-${reward?.points || ''}-${reward?.status || ''}-${reward?.linkedItem || ''}`;

    return <RewardModalInner key={modalKey} onClose={onClose} reward={reward} mode={mode} />;
};

export default RewardModal;
