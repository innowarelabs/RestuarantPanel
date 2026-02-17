import React from 'react';
import { Download, FileText } from 'lucide-react';

const ReportCategoryCard = ({ title, description, icon: Icon, color, onViewReport }) => {
    // Generate a very light version of the color for the icon background by replacing -500 with -50 or just using opacity
    const iconBgColor = color.replace('-500', '-50');
    // Ensure we have a valid text color
    const iconTextColor = color.replace('bg-', 'text-');

    return (
        <div className="bg-white rounded-[12px] border border-[#00000033] p-5 hover:shadow-md transition-all group">
            <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-[10px] ${iconBgColor} flex items-center justify-center shrink-0`}>
                    {Icon && React.createElement(Icon, { className: `w-6 h-6 ${iconTextColor}` })}
                </div>
                <div className="pt-0.5">
                    <h3 className="text-[18px] font-bold text-[#111827] leading-tight mb-1">{title}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-snug">{description}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onViewReport}
                    className="flex-1 h-[40px] bg-[#2BB29C] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#24A18C] active:scale-[0.98] transition-all"
                >
                    View Report
                </button>
                <button className="w-[44px] h-[40px] flex items-center justify-center bg-white border border-[#E8E8E8] rounded-[8px] text-[#6B7280] hover:text-[#2BB29C] hover:bg-gray-50 transition-colors">
                    <Download className="w-5 h-5" />
                </button>
                <button className="w-[44px] h-[40px] flex items-center justify-center bg-white border border-[#E8E8E8] rounded-[8px] text-[#6B7280] hover:text-[#2BB29C] hover:bg-gray-50 transition-colors">
                    <FileText className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ReportCategoryCard;
