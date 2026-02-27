import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Button from "../../elements/Button";
import PasswordInput from "../../elements/PasswordInput";
import TextInput from "../../elements/TextInput";
import restaurantLogo from "../../assets/restaurant_logo.png";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import { setSession } from "../../redux/store";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const getFieldError = () => {
        if (!email.trim()) return "Email / Username is required";
        if (!emailRegex.test(email)) return "Please enter a valid email address";
        if (!password.trim()) return "Password is required";
        return "";
    };
    const fieldError = hasSubmitted ? getFieldError() : "";
    const bannerError = error || fieldError;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setHasSubmitted(true);

        const validationError = getFieldError();
        if (validationError) {
            setError("");
            setLoading(false);
            return;
        }

        setError("");
        setLoading(true);

        try {
            localStorage.removeItem("twoFAStatus");
            localStorage.removeItem("twoFANextRoute");
            localStorage.removeItem("twoFAUserId");
            localStorage.removeItem("twoFAGoto");
            sessionStorage.removeItem("twoFAEmail");
            sessionStorage.removeItem("twoFAPassword");

            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");

            const url = `${baseUrl.replace(/\/$/, "")}/api/v1/auth/login`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const contentType = res.headers.get("content-type");
            const data = contentType?.includes("application/json") ? await res.json() : await res.text();

            console.log("Login API response:", { ok: res.ok, status: res.status, data });

            if (!res.ok) {
                const message =
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || "Login failed. Please try again.";
                throw new Error(message);
            }

            if (typeof data !== "object" || !data) throw new Error("Invalid login response");
            if (data.code !== "AUTH_200" && data.code !== "AUTH_202_2FA") {
                throw new Error(data.message || "Login failed. Please try again.");
            }

            const sessionData = data.data;
            console.log(sessionData);
            const onboardingStep = sessionData?.goto;
            const user = sessionData?.user || null;
            const is2FAEnabled = user?.is_2fa_enabled === true;
            const is2FASetup = user?.is_2fa_setup === true;
            const restaurantNameCandidates = [
                sessionData?.restaurant?.company_name,
                sessionData?.restaurant?.name,
                sessionData?.company_name,
                sessionData?.companyName,
                sessionData?.user?.restaurant?.company_name,
                sessionData?.user?.company_name,
                sessionData?.user?.companyName,
                sessionData?.user?.restaurant_name,
                sessionData?.user?.restaurantName,
            ];
            const restaurantName = restaurantNameCandidates.find((v) => typeof v === "string" && v.trim())?.trim() || "";
            const restaurantId =
                typeof sessionData?.user?.restaurant_id === "string"
                    ? sessionData.user.restaurant_id
                    : typeof sessionData?.user?.id === "string"
                        ? sessionData.user.id
                        : "";

            dispatch(
                setSession({
                    user,
                    accessToken: sessionData?.access_token || null,
                    refreshToken: sessionData?.refresh_token || null,
                    onboardingStep,
                    accessTokenExpiresIn: sessionData?.expires_in,
                    ...(restaurantName ? { restaurantName } : {}),
                })
            );

            if (restaurantId) {
                localStorage.setItem("restaurant_id", restaurantId);
            }

            if (is2FAEnabled) {
                const nextRoute = is2FASetup ? "/verify-2fa-otp" : "/setup-2fa-qr";
                localStorage.setItem("twoFAStatus", "pending");
                localStorage.setItem("twoFANextRoute", nextRoute);
                localStorage.setItem("twoFAGoto", onboardingStep);
                if (typeof user?.id === "string" && user.id.trim()) {
                    localStorage.setItem("twoFAUserId", user.id);
                }
                sessionStorage.setItem("twoFAEmail", email);
                sessionStorage.setItem("twoFAPassword", password);
                navigate(nextRoute, { state: { userId: user?.id, email, password, goto: onboardingStep }, replace: true });
                return;
            }

            if (onboardingStep === "dashboard") {
                navigate("/admin-dashboard", { replace: true });
            } else {
                navigate("/onboarding", { replace: true });
            }
        } catch (error) {
            setError(error?.error || error?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar */}
            <AuthSidebar />

            {/* Right Side */}
            <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-4 relative">

                {/* This container ONLY centers the form – nothing else affects it */}
                <div className="w-full max-w-md z-10 xl:min-w-[500px]">

                    {/* Mobile logo */}
                    <div className="flex justify-center mb-12 md:hidden">
                        <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
                    </div>

                    {/* Form Card – perfectly centered, untouched by the footer */}
                    <div className="bg-white p-8 rounded-3xl border border-black/70">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <h2 className="text-xl sm:text-[34px] text-left text-general-text font-bold">
                              Sign in to FreshBites
                            </h2>

                            {bannerError && (
                                <div className="flex items-center gap-2 bg-[#F751511F] rounded-[12px] py-[10px] px-[8px] mt-[-15px]">
                                    <AlertCircle size={20} color="#EB5757" />
                                    <p className="text-[12px] text-[#47464A] font-normal">{bannerError}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <TextInput
                                    id="email"
                                    type="email"
                                    label="Email / Username"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError("");
                                    }}
                                    className={hasSubmitted && !emailRegex.test(email) ? "border-red-400" : ""}
                                    required
                                />

                                <PasswordInput
                                    id="password"
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    className={hasSubmitted && !password.trim() ? "border-red-400" : ""}
                                    required
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <Link
                                    to="/forgot-password"
                                    className="text-[14px] text-[#47464A] text-left w-full sm:w-auto order-2 sm:order-1"
                                >
                                    Forgot Password?
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto min-w-[170px] h-[48px] order-1 sm:order-2 font-medium cursor-pointer"
                                >
                                    {loading ? "Signing In..." : "Sign In"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* This is the floating footer – overlays, never affects form positioning */}
                <div className="absolute inset-x-0 bottom-6 md:bottom-8 px-6 pointer-events-none">
                    <p className="text-center text-[13px] text-gray-500 max-w-md mx-auto leading-relaxed pointer-events-auto">
                        Protected by reCAPTCHA and subject to the Rekntek{" "}
                        <Link className="underline text-[#24B99E] hover:text-[#24B99E]/80">
                            Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link className="underline text-[#24B99E] hover:text-[#24B99E]/80">
                            Terms of Service
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </main>
    );
}

export default Login;
