import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../elements/Button";
import TextInput from "../../elements/TextInput";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import alertIcon from "../../assets/General/alert.svg";

function messageFromApiErrors(errors) {
    if (!errors || typeof errors !== "object") return "";
    const parts = [];
    for (const v of Object.values(errors)) {
        if (Array.isArray(v)) parts.push(...v.map(String));
        else if (typeof v === "string") parts.push(v);
    }
    return parts.filter(Boolean).join(" ");
}

function ForgotPassword() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isButtonEnabled = email.trim() !== "" && emailRegex.test(email);
    const loginFieldLabelClass =
        "absolute -top-2 left-3 px-1 bg-white font-sans text-[12px] font-normal not-italic leading-[100%] tracking-normal text-[#84818A] [leading-trim:none]";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const baseUrl = (import.meta.env.VITE_BACKEND_URL || "https://api.baaie.com").replace(/\/$/, "");
            const url = `${baseUrl}/api/v1/auth/forgot-password`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
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
                throw new Error(data.message || fromErrors || "Could not send reset code.");
            }

            navigate("/verify-account", { state: { email: email.trim() }, replace: true });
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
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
                                                Forgot password?
                                            </h2>
                                            <p className="font-sans text-[16px] font-normal leading-relaxed text-[#47464A]">
                                                Enter your registered email address. We’ll send a verification code to
                                                your email app before allowing password reset.
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="mt-[-15px] flex items-center gap-3 rounded-[12px] bg-[#F751511F] p-3 font-light text-xs text-[#47464A]">
                                                <img src={alertIcon} alt="Alert" className="h-5 w-5 shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <TextInput
                                                id="email"
                                                type="email"
                                                label="Email / username"
                                                labelClassName={loginFieldLabelClass}
                                                placeholder="admin@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                inputClassName={
                                                    email && !emailRegex.test(email)
                                                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/25"
                                                        : ""
                                                }
                                                required
                                            />
                                            {email && !emailRegex.test(email) && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    Please enter a valid email address
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="signIn"
                                            disabled={!isButtonEnabled || loading}
                                            className="w-full !h-[48px] !rounded-[12px] font-sans !text-[18px] !font-bold !text-white"
                                        >
                                            {loading ? "Sending..." : "Send Reset Code"}
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

export default ForgotPassword;
