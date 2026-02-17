import React, { useState } from 'react';
import eyeOn from '../assets/SignIn/eyeOn.svg';
import eyeOff from '../assets/SignIn/eyeOff.svg';

const PasswordInput = ({ label, id, className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative group w-full">
            <label
                htmlFor={id}
                className="absolute left-4 -top-3 px-2 bg-white text-[12px] text-[#6B7280] z-10 pointer-events-none"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    className={`w-full h-[56px] px-5 py-4.5 rounded-[12px] border border-[#DCDBDD] focus:outline-none focus:border-[#24B99E] transition-colors bg-white text-[#1F2937] placeholder-[#D1D5DB] text-[16px] relative z-0 ${className}`}
                    {...props}
                />
                <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity z-10"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    <img src={showPassword ? eyeOff : eyeOn} alt="toggle password" />
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;
