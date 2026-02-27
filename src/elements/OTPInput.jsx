import { useEffect, useRef, useState } from "react";
import Button from "./Button";

const OTPInput = ({ otp, setOtp, onSubmit, loading, error = "" }) => {
  const [otpError, setOtpError] = useState(error);
  const inputRefs = useRef([]);

  useEffect(() => {
    setOtpError(error);
  }, [error]);

  useEffect(() => {
    if (!otpError) return;
    const timer = setTimeout(() => setOtpError(""), 3000);
    return () => clearTimeout(timer);
  }, [otpError]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleClick = (index) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="space-y-3">
        <p className="text-center text-sm text-gray-600 font-medium">Enter 6-digit code</p>

        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              onClick={() => handleClick(index)}
              onFocus={(e) => e.target.select()}
              ref={(el) => (inputRefs.current[index] = el)}
              className={`
                w-10 h-11 sm:w-14 sm:h-14 lg:w-[64px] lg:h-[64px]
                text-center text-[19px]
                text-general-text caret-black
                rounded-[12px] transition-all duration-200
                focus:outline-none focus:ring-1 focus:ring-[#24B99E]/20 focus:border-[#24B99E]
                cursor-text
                ${otpError
                  ? "border border-red-500 bg-red-50 text-red-900"
                  : digit
                    ? "border border-[#24B99E] bg-[#24B99E]/5 text-general-text"
                    : "border border-black/70 bg-white text-general-text"
                }
              `}
              style={{ caretColor: "#000000" }}
            />
          ))}
        </div>
      </div>

      <Button onClick={onSubmit} disabled={!isComplete || loading} className="w-full h-[48px] font-medium cursor-pointer">
        {loading ? "Verifying..." : "Verify & Continue"}
      </Button>
    </div>
  );
};

export default OTPInput;

