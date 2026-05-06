import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import alertIcon from "../../assets/General/alert.svg";
import Button from "../../elements/Button";

function messageFromApiErrors(errors) {
    if (!errors || typeof errors !== "object") return "";
    const parts = [];
    for (const v of Object.values(errors)) {
        if (Array.isArray(v)) parts.push(...v.map(String));
        else if (typeof v === "string") parts.push(v);
    }
    return parts.filter(Boolean).join(" ");
}

/** Same contract as Forgot password: POST /api/v1/auth/forgot-password */
async function postForgotPassword(email) {
    const baseUrl = (import.meta.env.VITE_BACKEND_URL || "https://api.baaie.com").replace(/\/$/, "");
    const url = `${baseUrl}/api/v1/auth/forgot-password`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const contentType = res.headers.get("content-type");
    const data = contentType?.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
        const fromErrors = data && typeof data === "object" ? messageFromApiErrors(data.errors) : "";
        const message =
            (data && typeof data === "object" && (data.message || fromErrors)) ||
            (typeof data === "string" ? data : "") ||
            `Request failed (${res.status})`;
        throw new Error(message);
    }

    if (!data || typeof data !== "object") {
        throw new Error("Invalid response from server");
    }

    if (data.code !== "SUCCESS_200") {
        const fromErrors = messageFromApiErrors(data.errors);
        throw new Error(data.message || fromErrors || "Could not send code.");
    }

    return data;
}

const VerifyAccount = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "******891";
    const emailForRequest = (location.state?.email || "").trim();

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState("");

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

    const handleResend = async () => {
        if (!emailForRequest) {
            setError("Please start again from Forgot password.");
            return;
        }
        setError("");
        setResendLoading(true);
        try {
            const data = await postForgotPassword(emailForRequest);
            setOtp(["", "", "", "", "", ""]);
            const apiMessage = typeof data.message === "string" ? data.message.trim() : "";
            toast.success(apiMessage || "A new verification code has been sent to your email.");
            inputRefs[0].current?.focus();
        } catch (err) {
            setError(err?.message || "Could not resend the code. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const otpValue = otp.join("");
        if (otpValue.length !== 6) return;

        if (!emailForRequest) {
            setError("Please start again from Forgot password.");
            return;
        }

        setLoading(true);
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || "https://api.baaie.com").replace(/\/$/, "");
            const url = `${baseUrl}/api/v1/auth/verify-otp`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailForRequest, otp: otpValue }),
            });

            const contentType = res.headers.get("content-type");
            const data = contentType?.includes("application/json") ? await res.json() : null;

            if (!res.ok) {
                const fromErrors = data && typeof data === "object" ? messageFromApiErrors(data.errors) : "";
                const message =
                    (data && typeof data === "object" && (data.message || fromErrors)) ||
                    (typeof data === "string" ? data : "") ||
                    `Request failed (${res.status})`;
                throw new Error(message);
            }

            if (!data || typeof data !== "object") {
                throw new Error("Invalid response from server");
            }

            if (data.code !== "SUCCESS_200") {
                const fromErrors = messageFromApiErrors(data.errors);
                throw new Error(data.message || fromErrors || "Verification failed.");
            }

            const resetToken = typeof data.data === "string" ? data.data : "";
            if (!resetToken) {
                throw new Error("Invalid verification response.");
            }

            navigate("/reset-password", { state: { reset_token: resetToken, email: emailForRequest }, replace: true });
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const isComplete = otp.every((v) => v !== "");
    const canSubmit = isComplete && Boolean(emailForRequest);

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
                                        {error && (
                                            <div className="flex items-center gap-3 rounded-[12px] bg-[#F751511F] p-3 font-light text-xs text-[#47464A]">
                                                <img src={alertIcon} alt="Alert" className="h-5 w-5 shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-wrap justify-center gap-2 sm:gap-3">
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
                                                disabled={!canSubmit || loading || resendLoading}
                                                className="w-full !h-[48px] !rounded-[12px] font-sans !text-[18px] !font-bold !text-white"
                                            >
                                                {loading ? "Verifying..." : "Continue"}
                                            </Button>
                                            <p className="text-center font-sans text-[14px] font-normal text-[#47464A]">
                                                Didn&apos;t get the code?{" "}
                                                <button
                                                    type="button"
                                                    onClick={() => void handleResend()}
                                                    disabled={!emailForRequest || resendLoading || loading}
                                                    className="ml-1 font-bold text-[#202020] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                                                >
                                                    {resendLoading ? "Sending..." : "Resend"}
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
