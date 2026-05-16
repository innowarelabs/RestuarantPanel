import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Button from "../../elements/Button";
import PasswordInput from "../../elements/PasswordInput";
import TextInput from "../../elements/TextInput";
import restaurantLogo from "../../assets/restaurant_logo.png";
import alertIcon from "../../assets/General/alert.svg";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import { setSession } from "../../redux/store";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const loginFieldLabelClass =
        "absolute -top-2 left-3 px-1 bg-white font-sans text-[12px] font-normal not-italic leading-[100%] tracking-normal text-[#84818A] [leading-trim:none]";
    const isPasswordValid = password.trim() !== "";
    const isFormValid = emailRegex.test(email) && isPasswordValid;
    const emailFormatInvalid = Boolean(email) && !emailRegex.test(email);
    const emailFieldError = Boolean(error) || emailFormatInvalid;
    const passwordFieldError = Boolean(error);
    const loginPasswordErrorStyles =
        "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/25";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            localStorage.removeItem("twoFAStatus");
            localStorage.removeItem("twoFANextRoute");
            localStorage.removeItem("twoFAUserId");
            localStorage.removeItem("twoFAGoto");
            sessionStorage.removeItem("twoFAEmail");
            sessionStorage.removeItem("twoFAPassword");

            const url = "https://api.baaie.com/api/v1/auth/restaurant/login";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const contentType = res.headers.get("content-type");
            const data = contentType?.includes("application/json") ? await res.json() : await res.text();

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
            const restaurantName =
                restaurantNameCandidates.find((v) => typeof v === "string" && v.trim())?.trim() || "";
            const restaurantId =
                typeof sessionData?.user?.restaurant_id === "string"
                    ? sessionData.user.restaurant_id
                    : typeof sessionData?.user?.id === "string"
                      ? sessionData.user.id
                      : "";
            const restaurantIsOpen = typeof sessionData?.is_open === "boolean" ? sessionData.is_open : undefined;

            dispatch(
                setSession({
                    user,
                    accessToken: sessionData?.access_token || null,
                    refreshToken: sessionData?.refresh_token || null,
                    onboardingStep,
                    accessTokenExpiresIn: sessionData?.expires_in,
                    ...(restaurantName ? { restaurantName } : {}),
                    ...(typeof restaurantIsOpen === "boolean" ? { restaurantIsOpen } : {}),
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
                navigate(nextRoute, {
                    state: { userId: user?.id, email, password, goto: onboardingStep },
                    replace: true,
                });
                return;
            }

            if (onboardingStep === "dashboard") {
                navigate("/admin-dashboard", { replace: true });
            } else {
                navigate("/onboarding", { replace: true });
            }
        } catch (err) {
            setError(err?.error || err?.message || "Login failed. Please try again.");
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
                                    <img
                                        src={restaurantLogo}
                                        alt="Restaurant"
                                        className="h-20 w-auto max-w-[280px] object-contain sm:h-24"
                                    />
                                </div>

                                <div className="space-y-8 rounded-3xl border border-black/70 bg-white p-8">
                                    <h2 className="text-left font-sans text-[36px] font-bold not-italic leading-[100%] tracking-normal text-[#202020] [leading-trim:none]">
                                        Sign in to FreshBites
                                    </h2>

                                    {error && (
                                        <div className="mt-[-15px] flex items-center gap-3 rounded-[12px] bg-[#F751511F] p-3 font-light text-xs text-[#47464A]">
                                            <img src={alertIcon} alt="Alert" className="h-5 w-5 shrink-0" />
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-1">
                                            <TextInput
                                                id="email"
                                                type="email"
                                                label="Email / username"
                                                labelClassName={loginFieldLabelClass}
                                                placeholder="admin@example.com"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setError("");
                                                }}
                                                invalid={emailFieldError}
                                                inputClassName={
                                                    emailFieldError
                                                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/25"
                                                        : ""
                                                }
                                                required
                                            />
                                            {emailFormatInvalid && (
                                                <p className="text-xs text-red-600">
                                                    Please enter a valid email address
                                                </p>
                                            )}
                                        </div>

                                        <PasswordInput
                                            label="Password"
                                            labelClassName={loginFieldLabelClass}
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setError("");
                                            }}
                                            invalid={passwordFieldError}
                                            inputClassName={passwordFieldError ? loginPasswordErrorStyles : ""}
                                            required
                                        />

                                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                                            <Link
                                                to="/forgot-password"
                                                className="order-2 w-full text-left font-sans text-[14px] font-normal not-italic leading-[100%] tracking-normal text-primary-gray [leading-trim:none] sm:order-1 sm:w-auto"
                                            >
                                                Forgot password?
                                            </Link>
                                            <Button
                                                type="submit"
                                                variant="signIn"
                                                loading={loading}
                                                disabled={!isFormValid || loading}
                                                className="order-1 !h-[48px] !w-[206px] min-w-[206px] shrink-0 !gap-[10px] !rounded-[12px] !px-[58px] !py-[14px] font-sans !text-[18px] !font-bold not-italic !leading-[100%] tracking-normal !text-white [leading-trim:none] sm:order-2 cursor-pointer"
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                                                ) : (
                                                    "Sign In"
                                                )}
                                            </Button>
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
}

export default Login;
