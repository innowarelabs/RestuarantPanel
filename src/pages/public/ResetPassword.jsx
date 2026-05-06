import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import alertIcon from "../../assets/General/alert.svg";
import Button from "../../elements/Button";
import PasswordInput from "../../elements/PasswordInput";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import tick from "../../assets/General/tick.svg";
import cross from "../../assets/General/cross.svg";

function messageFromApiErrors(errors) {
    if (!errors || typeof errors !== "object") return "";
    const parts = [];
    for (const v of Object.values(errors)) {
        if (Array.isArray(v)) parts.push(...v.map(String));
        else if (typeof v === "string") parts.push(v);
    }
    return parts.filter(Boolean).join(" ");
}

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const { reset_token: token } = location.state || {};
    const resetToken = typeof token === "string" ? token.trim() : "";
    const hasValidToken = resetToken.length > 0;

    const [error, setError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const passwordsMatch = newPassword === repeatPassword && repeatPassword !== "";

    const isFormValid =
        hasMinLength && hasNumber && hasUppercase && hasSpecialChar && passwordsMatch;

    const loginFieldLabelClass =
        "absolute -top-2 left-3 px-1 bg-white font-sans text-[12px] font-normal not-italic leading-[100%] tracking-normal text-[#84818A] [leading-trim:none]";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!hasValidToken) {
            setError("Invalid or expired reset link. Please start again from Forgot password.");
            return;
        }
        if (!isFormValid) return;

        setLoading(true);
        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || "https://api.baaie.com").replace(/\/$/, "");
            const url = `${baseUrl}/api/v1/auth/reset-password`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, new_password: newPassword }),
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
                throw new Error(data.message || fromErrors || "Password reset failed.");
            }

            const successMsg =
                (typeof data.message === "string" && data.message.trim()) || "Password reset successfully";
            toast.success(successMsg);
            navigate("/password-reset-success", { replace: true });
        } catch (err) {
            setError(err?.message || "Password reset failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="space-y-2">
                                            <h2 className="text-left font-sans text-[36px] font-bold not-italic leading-[100%] tracking-normal text-[#202020] [leading-trim:none]">
                                                Reset password
                                            </h2>
                                            <p className="font-sans text-[16px] font-normal leading-relaxed text-[#47464A]">
                                                Please create a new password that you don’t use on any other site.
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="mt-[-15px] flex items-center gap-3 rounded-[12px] bg-[#F751511F] p-3 font-light text-xs text-[#47464A]">
                                                <img src={alertIcon} alt="Alert" className="h-5 w-5 shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}

                                        {!hasValidToken && !error && (
                                            <div className="mt-[-15px] flex items-center gap-3 rounded-[12px] bg-[#F751511F] p-3 font-light text-xs text-[#47464A]">
                                                <img src={alertIcon} alt="Alert" className="h-5 w-5 shrink-0" />
                                                <p>
                                                    Invalid or expired reset link. Please start again from Forgot
                                                    password.
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <PasswordInput
                                                    id="new-password"
                                                    label="New Password"
                                                    labelClassName={loginFieldLabelClass}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                    required
                                                />

                                                {newPassword && (
                                                    <div className="space-y-1 pt-1">
                                                        {hasMinLength &&
                                                        hasNumber &&
                                                        hasUppercase &&
                                                        hasSpecialChar ? null : (
                                                            <p className="text-sm font-medium text-red-600">
                                                                Weak Password
                                                            </p>
                                                        )}
                                                        {[
                                                            {
                                                                condition: hasMinLength,
                                                                text: "At least 8 characters",
                                                            },
                                                            { condition: hasNumber, text: "Contains a number" },
                                                            {
                                                                condition: hasUppercase,
                                                                text: "Contains an uppercase letter",
                                                            },
                                                            {
                                                                condition: hasSpecialChar,
                                                                text: "Contains a special character (!@#$ etc.)",
                                                            },
                                                        ].map((rule, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`flex items-center gap-2 text-xs ${
                                                                    rule.condition
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                <img
                                                                    src={rule.condition ? tick : cross}
                                                                    alt=""
                                                                    className="h-4 w-4"
                                                                />
                                                                <span>{rule.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <PasswordInput
                                                    id="repeat-password"
                                                    label="Confirm New Password"
                                                    labelClassName={loginFieldLabelClass}
                                                    value={repeatPassword}
                                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                                    placeholder="Repeat your password"
                                                    required
                                                />

                                                {repeatPassword && (
                                                    <p
                                                        className={`flex items-center gap-1 text-xs ${
                                                            passwordsMatch ? "text-green-600" : "text-red-600"
                                                        }`}
                                                    >
                                                        <img
                                                            src={passwordsMatch ? tick : cross}
                                                            alt=""
                                                            className="h-4 w-4"
                                                        />
                                                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="signIn"
                                            disabled={!isFormValid || loading || !hasValidToken}
                                            className="w-full !h-[48px] !rounded-[12px] font-sans !text-[18px] !font-bold !text-white"
                                        >
                                            {loading ? "Resetting..." : "Reset Password"}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ResetPassword;
