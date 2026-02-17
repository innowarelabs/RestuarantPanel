import React from 'react';

const Button = ({ children, className, type = "button", ...props }) => {
    return (
        <button
            type={type}
            className={`bg-[#24B99E] text-white rounded-[12px] font-[800] transition-all hover:bg-[#1e9d86] disabled:bg-[#979797] disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
