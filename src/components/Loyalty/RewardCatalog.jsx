import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RewardCard from './RewardCard';
import RewardModal from './RewardModal';
import DeleteRewardModal from './DeleteRewardModal';

const RewardCatalog = ({
    rewards = [],
    loading = false,
    error = null,
    menuItems = [],
    categories = [],
    loadingMenuItems = false,
    rewardTypes = [],
    loadingRewardTypes = false,
    rewardTypesError = null,
    onSaveReward,
    onDeleteReward,
    onRefreshRewards,
    wrapperClassName = '',
    headingTitle = 'Reward Catalog',
    headingSubtitle = 'Define which free items customers can redeem using points.',
    addButtonLabel = 'Add Reward Item',
}) => {
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

    const handleConfirmDelete = async () => {
        if (rewardToDelete && onDeleteReward) {
            const success = await onDeleteReward(rewardToDelete.reward_id || rewardToDelete.id);
            if (success) {
                setRewardToDelete(null);
                setIsDeleteModalOpen(false);
            }
        }
    };

    const handleSaveReward = async (formData) => {
        let success = false;
        if (onSaveReward) {
            success = await onSaveReward({
                ...formData,
                ...(selectedReward?.reward_id ? { reward_id: selectedReward.reward_id } : {})
            });
        }
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div
            className={`mb-8 bg-[#FFFFFF] p-6 border border-[#E5E7EB] rounded-[16px] -mt-[20px] ${wrapperClassName}`.trim()}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-[18px] font-[800] text-general-text">{headingTitle}</h2>
                    <p className="text-[13px] text-[#6B7280]">{headingSubtitle}</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-[8px] text-[14px] font-[500] hover:bg-primary/90 transition-colors active:scale-95 transition-transform"
                >
                    <Plus className="w-4 h-4" /> {addButtonLabel}
                </button>
            </div>

            {(error || rewardTypesError) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error && <div>{error}</div>}
                    {rewardTypesError && <div>{rewardTypesError}</div>}
                    {onRefreshRewards && (
                        <button 
                            onClick={onRefreshRewards}
                            className="ml-2 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                            <div className="h-32 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : rewards.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards yet</h3>
                    <p className="text-gray-500 mb-6">Create your first reward to start engaging customers with your loyalty program.</p>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Your First Reward
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map(reward => (
                        <RewardCard
                            key={reward.reward_id || reward.id}
                            reward={reward}
                            onEdit={handleEditClick}
                            onReactivate={handleReactivateClick}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit/Reactivate Modal */}
            <RewardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                reward={selectedReward}
                mode={modalMode}
                menuItems={menuItems}
                categories={categories}
                loadingMenuItems={loadingMenuItems}
                rewardTypes={rewardTypes}
                loadingRewardTypes={loadingRewardTypes}
                onSave={handleSaveReward}
            />

            {/* Delete Confirmation Modal */}
            <DeleteRewardModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                rewardName={rewardToDelete?.reward_name || rewardToDelete?.name}
            />
        </div>
    );
};

export default RewardCatalog;
