import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import Button from "../../elements/Button";

const VerifyAccount = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "******891";

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length === 6) {
            console.log("Verifying code", otpValue);
            navigate("/reset-password", { state: { reset_token: "dummy_token" } });
        }
    };

    const isComplete = otp.every((v) => v !== "");

    return (
        <main className="flex min-h-screen flex-col md:h-screen md:max-h-screen md:flex-row md:overflow-hidden">
            <AuthSidebar />

            <div className="flex min-h-screen flex-1 flex-col bg-white md:min-h-0 md:h-full">
                <div className="h-full min-h-0 flex-1 overflow-y-auto">
                    <div className="flex min-h-full flex-col px-4 pt-4">
                        <div className="flex min-h-0 flex-1 items-center justify-center pt-6 md:pt-8 pb-8">
                            <div className="mx-auto w-full max-w-md xl:min-w-[500px]">
                                <div className="mb-12 flex justify-center md:hidden">
                                    <img src={restaurantLogo} alt="Restaurant" className="h-12 w-auto" />
                                </div>

                                <div className="space-y-8 rounded-3xl border border-black/70 bg-white p-8">
                                    <div className="space-y-2">
                                        <h2 className="text-left font-sans text-[36px] font-bold not-italic leading-[100%] tracking-normal text-[#202020] [leading-trim:none]">
                                            Verify your account
                                        </h2>
                                        <p className="font-sans text-[16px] font-normal leading-relaxed text-[#47464A]">
                                            We&apos;ve sent a code to {email}. Enter that code to confirm your account.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="flex justify-between gap-2 sm:gap-3">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={inputRefs[index]}
                                                    type="text"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    className={`h-[50px] w-[42px] rounded-[10px] border bg-white text-center text-[20px] font-bold text-[#1F2937] transition-all focus:outline-none sm:h-[62px] sm:w-[62px] sm:rounded-[12px] sm:text-[24px] ${
                                                        digit
                                                            ? "border-primary"
                                                            : "border-[#DCDBDD]"
                                                    } focus:border-primary focus:ring-1 focus:ring-primary`}
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-6">
                                            <Button
                                                type="submit"
                                                variant="signIn"
                                                disabled={!isComplete}
                                                className="w-full !h-[48px] !rounded-[12px] font-sans !text-[18px] !font-bold !text-white"
                                            >
                                                Continue
                                            </Button>
                                            <p className="text-center font-sans text-[14px] font-normal text-[#47464A]">
                                                Didn&apos;t get the code?{" "}
                                                <button
                                                    type="button"
                                                    className="ml-1 font-bold text-[#202020] hover:underline"
                                                >
                                                    Resend
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default VerifyAccount;
