import React from 'react';
import LoyaltyHeader from '../../components/Loyalty/LoyaltyHeader';
import PointsEarningSettings from '../../components/Loyalty/PointsEarningSettings';
import RewardCatalog from '../../components/Loyalty/RewardCatalog';
import LoyaltyInsights from '../../components/Loyalty/LoyaltyInsights';

const LoyaltyProgram = () => {
    return (
        <div className="max-w-[1600px]  mx-auto pb-12 ">
            <LoyaltyHeader />

            <div className="grid grid-cols-1 gap-8">
                <PointsEarningSettings />
                <RewardCatalog />
                <LoyaltyInsights />
            </div>
        </div>
    );
};

export default LoyaltyProgram;
