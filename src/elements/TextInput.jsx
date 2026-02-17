import React from 'react';

const TextInput = ({ label, id, className, ...props }) => {
    return (
        <div className="relative group w-full">
            <label
                htmlFor={id}
                className="absolute left-4 -top-3 px-2 bg-white text-[12px] text-[#84818A] z-10 pointer-events-none"
            >
                {label}
            </label>
            <input
                id={id}
                className={`w-full h-[56px] px-5 py-4.5 rounded-[12px] border border-[#DCDBDD] focus:outline-none focus:border-[#24B99E] transition-colors bg-white text-[#1F2937] placeholder-[#D1D5DB] text-[16px] relative z-0 ${className}`}
                {...props}
            />
        </div>
    );
};

export default TextInput;
