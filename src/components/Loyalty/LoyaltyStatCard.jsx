import React from 'react';

const LoyaltyStatCard = ({ title, value, subtext, icon, bgColor, textColor }) => {
    return (
        <div className={`p-4 rounded-[12px] ${bgColor} border-none`}>
            <div className="flex items-center gap-2 mb-3">
                <div className={`${textColor} opacity-70`}>
                    {icon}
                </div>
                <p className="text-[13px] font-medium text-gray-500">{title}</p>
            </div>
            <h3 className="text-[26px] font-bold text-general-text leading-tight">{value}</h3>
            {subtext && (
                <p className="text-[12px] text-gray-400 font-medium mt-1">{subtext}</p>
            )}
        </div>
    );
};

export default LoyaltyStatCard;
