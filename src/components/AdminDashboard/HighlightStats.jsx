import React from 'react';
import { TrendingUp } from 'lucide-react';
import zingerImg from '../../assets/DashbordImage/zinger.jpg';
import loadedFriesImg from '../../assets/DashbordImage/loaded fries.jpg';
import trophyVector from '../../assets/DashbordImage/Vector.png';

const HighlightStats = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Best Seller Card */}
            <div className="bg-white rounded-[12px] h-[104px] p-4 border border-[#00000033] flex items-center gap-4">
                <div className="w-[60px] h-[60px] rounded-[10px] bg-yellow-100 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={zingerImg}
                        alt="Zinger Burger"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <img src={trophyVector} alt="trophy" className="w-[12px] h-[12px]" />
                        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">BEST SELLER TODAY</span>
                    </div>
                    <h3 className="text-[16px] font-[400] text-[#0F1724]">Zinger Burger</h3>
                    <p className="text-[12px] text-[#6B7280]">324 orders today</p>
                </div>
            </div>

            {/* Rising Star Card 1 */}
            <div className="bg-white rounded-[16px] p-4 border border-[#00000033] flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-[60px] h-[60px] rounded-[10px] bg-orange-100 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={loadedFriesImg}
                        alt="Loaded Fries"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#15B99E]" />
                        <span className="text-[10px]  text-[#9CA3AF] uppercase tracking-wider">RISING STAR</span>
                    </div>
                    <h3 className="text-[16px] font-[400] text-[#0F1724]">Loaded Fries</h3>
                    <p className="text-[12px] text-[#15B99E]">+27% growth this week</p>
                </div>
            </div>

            {/* Rising Star Card 2 */}
            <div className="bg-white rounded-[16px] p-4 border border-[#00000033] flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-[60px] h-[60px] rounded-[10px] bg-green-100 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={loadedFriesImg}
                        alt="Loaded Fries"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#15B99E]" />
                        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">RISING STAR</span>
                    </div>
                    <h3 className="text-[16px] font-[400] text-[#111827]">Loaded Fries</h3>
                    <p className="text-[12px] text-[#15B99E]">+15% growth this week</p>
                </div>
            </div>
        </div>
    );
};

export default HighlightStats;
