import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RewardCard from './RewardCard';
import RewardModal from './RewardModal';
import DeleteRewardModal from './DeleteRewardModal';

const RewardCatalog = () => {
    const [rewards, setRewards] = useState([
        {
            id: 1,
            name: "Free Ice Cream",
            description: "Choose any flavour",
            points: 175,
            linkedItem: "Ice Cream Cone",
            redemptions: 23,
            status: "Active",
            image: "🍦"
        },
        {
            id: 2,
            name: "Free Fries",
            description: "Regular portion",
            points: 150,
            linkedItem: "French Fries (Regular)",
            redemptions: 17,
            status: "Active",
            image: "🍟"
        },
        {
            id: 3,
            name: "Free Drink",
            description: "Any size soft drink",
            points: 100,
            linkedItem: "Soft Drink (Any Size)",
            redemptions: 9,
            status: "Inactive",
            image: "🥤"
        },
        {
            id: 4,
            name: "Free Burger",
            description: "Classic cheeseburger",
            points: 350,
            linkedItem: "Cheeseburger",
            redemptions: 12,
            status: "Active",
            image: "🍔"
        },
        {
            id: 5,
            name: "Free Coffee",
            description: "Regular coffee",
            points: 120,
            linkedItem: "Coffee",
            redemptions: 31,
            status: "Active",
            image: "☕"
        },
        {
            id: 6,
            name: "Free Cookie",
            description: "Freshly baked",
            points: 80,
            linkedItem: "Cookie",
            redemptions: 8,
            status: "Active",
            image: "🍪"
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedReward, setSelectedReward] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rewardToDelete, setRewardToDelete] = useState(null);

    const handleAddClick = () => {
        setModalMode('add');
        setSelectedReward(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (reward) => {
        setModalMode('edit');
        setSelectedReward(reward);
        setIsModalOpen(true);
    };

    const handleReactivateClick = (reward) => {
        setModalMode('reactivate');
        setSelectedReward(reward);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (reward) => {
        setRewardToDelete(reward);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (rewardToDelete) {
            setRewards(rewards.filter(r => r.id !== rewardToDelete.id));
            setRewardToDelete(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="mb-8 bg-[#FFFFFF] p-6 border border-[#E5E7EB] rounded-[16px] -mt-[20px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-[18px] font-[800] text-general-text">Reward Catalog</h2>
                    <p className="text-[13px] text-[#6B7280]">Define which free items customers can redeem using points.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-[8px] text-[14px] font-[500] hover:bg-primary/90 transition-colors active:scale-95 transition-transform"
                >
                    <Plus className="w-4 h-4" /> Add Reward Item
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                    <RewardCard
                        key={reward.id}
                        reward={reward}
                        onEdit={handleEditClick}
                        onReactivate={handleReactivateClick}
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>

            {/* Add/Edit/Reactivate Modal */}
            <RewardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                reward={selectedReward}
                mode={modalMode}
            />

            {/* Delete Confirmation Modal */}
            <DeleteRewardModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                rewardName={rewardToDelete?.name}
            />
        </div>
    );
};

export default RewardCatalog;
