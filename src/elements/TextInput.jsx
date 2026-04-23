const defaultLabelClass =
    "absolute -top-2 left-3 px-1 bg-white text-xs font-thin text-general-text/50";

const TextInput = ({
    id,
    type = "text",
    value,
    onChange,
    placeholder = "",
    label,
    labelClassName = defaultLabelClass,
    className = "",
    inputClassName = "",
    invalid = false,
    required = false,
    name,
}) => {
    return (
        <div className={className}>
            <div className="relative">
                <input
                    type={type}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    aria-invalid={invalid || undefined}
                    className={`w-full p-3 border border-gray-300 rounded-[12px] focus:outline-none focus:border-primary font-normal transition placeholder:text-md placeholder:font-normal placeholder:text-gray-300 text-general-text ${inputClassName}`}
                />
                {label && (
                    <label htmlFor={id} className={labelClassName}>
                        {label}
                    </label>
                )}
            </div>
        </div>
    );
};

export default TextInput;
