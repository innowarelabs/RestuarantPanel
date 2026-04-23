import { useState } from "react";
import eyeOn from "../assets/SignIn/eyeOn.svg";
import eyeOff from "../assets/SignIn/eyeOff.svg";

const defaultLabelClass =
    "absolute -top-2 left-3 px-1 bg-white text-xs font-thin text-general-text/50";

const PasswordInput = ({
    id = "password",
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder = "Enter your password",
    label = "Password",
    labelClassName = defaultLabelClass,
    className = "",
    inputClassName = "",
    invalid = false,
    required = false,
    name,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={className}>
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    aria-invalid={invalid || undefined}
                    className={`w-full p-3 pr-12 border border-gray-300 rounded-[12px] font-normal focus:outline-none focus:border-primary transition placeholder:text-md placeholder:font-normal placeholder:text-gray-300 ${inputClassName} ${
                        invalid
                            ? showPassword
                                ? "!text-black !caret-black ![-webkit-text-fill-color:#000000]"
                                : "!text-red-600 !caret-red-600 ![-webkit-text-fill-color:rgb(220_38_38)]"
                            : "text-general-text"
                    }`}
                />

                <label htmlFor={id} className={labelClassName}>
                    {label}
                </label>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    <img
                        src={showPassword ? eyeOff : eyeOn}
                        alt={showPassword ? "Hide password" : "Show password"}
                        className="w-5 h-5 object-contain"
                    />
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;
