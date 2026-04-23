import { Edit, Trash2, Award } from 'lucide-react';

const RewardCard = ({ reward, onEdit, onReactivate, onDelete }) => {
    const {
        reward_name,
        name,
        description,
        points_required,
        points,
        menu_item_id,
        linked_item,
        linkedItem,
        redemptions,
        is_active,
        status,
        reward_image,
        image
    } = reward;

    const displayName = reward_name || name;
    const displayPoints = points_required || points;
    const displayMenuItem = menu_item_id || linked_item || linkedItem;
    const displayImage = reward_image || image;
    const displayStatus = is_active !== undefined ? (is_active ? 'Active' : 'Inactive') : status;

    return (
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 flex flex-col items-start relative shadow-sm">
            <span className={`absolute top-3 right-3 px-3 py-1 rounded-[8px] text-[12px] font-medium ${displayStatus === 'Active' ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-gray-100 text-gray-500'}`}>
                {displayStatus}
            </span>

            <div className="w-16 h-16 bg-[#F6F8F9] rounded-[12px] flex items-center justify-center mb-4 text-3xl">
                {displayImage}
            </div>

            <h3 className="text-[#1F2937] text-[18px] font-semibold mb-1">{displayName}</h3>
            <p className="text-[14px] text-[#6B7280] mb-4">{description}</p>

            <div className="bg-[#FEF2F2] text-[#B91C1C] text-[14px] font-semibold px-3 py-1.5 rounded-[8px] mb-5 inline-block">
                {displayPoints} points
            </div>

            {/* <div className="w-full text-left space-y-1 mb-6">
                <p className="text-[14px] text-[#6B7280]">Linked Item:</p>
                <p className="text-[15px] font-semibold text-[#1F2937]">{displayMenuItem}</p>
                <div className="flex items-center text-[14px] text-[#6B7280] mt-3">
                    <Award className="w-4 h-4 mr-2" />
                    Redeemed {redemptions || 0} times
                </div>
            </div> */}

            <div className="w-full flex items-center gap-2 pt-5 border-t border-[#F3F4F6] mt-auto">
                {displayStatus === 'Active' ? (
                    <>
                        <button
                            onClick={() => onEdit(reward)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-[#4B5563] border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 transition-colors"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                            onClick={() => onDelete(reward)}
                            className="p-2.5 text-[#EF4444] border border-[#FEE2E2] rounded-[10px] hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onReactivate(reward)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-[#4B5563] border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 transition-colors"
                        >
                            Reactivate
                        </button>
                        <button
                            onClick={() => onDelete(reward)}
                            className="p-2.5 text-[#EF4444] border border-[#FEE2E2] rounded-[10px] hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RewardCard;
