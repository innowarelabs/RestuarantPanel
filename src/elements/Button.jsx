import React from "react";

const Button = React.forwardRef(
    (
        {
            onClick,
            className = "",
            variant = "primary",
            children,
            disabled = false,
            loading = false,
            icon = null,
            type = "button",
            ...props
        },
        ref
    ) => {
        const baseStyles =
            "py-2 px-4 rounded-[12px] transition duration-300 flex items-center justify-center gap-2";

        const variantStyles = {
            outline: "bg-transparent border border-primary text-primary hover:bg-primary hover:text-white",
            primary: "bg-primary text-white hover:bg-primary/80",
            signIn:
                "border-0 text-white enabled:bg-[rgba(221,47,38,1)] enabled:hover:bg-[rgba(200,42,35,1)] disabled:bg-[rgba(151,151,151,1)]",
            ghost: "bg-transparent text-[#6B6B6B] hover:bg-primary/5",
        };

        const handleClick = (e) => {
            if (disabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            onClick?.(e);
        };

        const v = variantStyles[variant] ? variant : "primary";

        return (
            <button
                ref={ref}
                type={type}
                onClick={handleClick}
                disabled={disabled}
                aria-busy={loading || undefined}
                className={`${baseStyles} ${variantStyles[v]} ${className} disabled:cursor-not-allowed ${
                    loading ? "disabled:!bg-[rgba(221,47,38,1)]" : "disabled:bg-[#979797]"
                }`}
                {...props}
            >
                {icon && <img src={icon} alt="" className="w-4 h-4" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
