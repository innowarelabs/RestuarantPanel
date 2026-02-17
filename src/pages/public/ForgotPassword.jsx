import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Button from "../../elements/Button";
import TextInput from "../../elements/TextInput";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import alertIcon from '../../assets/General/alert.svg';

function ForgotPassword() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isButtonEnabled = email.trim() !== "" && emailRegex.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Simulation of forgot password action
            console.log("Sending reset code to:", email);
            // await dispatch(forgotPassword(email));

            setTimeout(() => {
                navigate("/verify-account", { state: { email }, replace: true });
            }, 1000);
        } catch (error) {
            setError(error?.error || error?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar - hidden on mobile */}
            <AuthSidebar />

            {/* Right Side - Full height + relative for absolute footer */}
            <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-4 relative">

                {/* Centered Form - completely unaffected by footer */}
                <div className="w-full max-w-md z-10 xl:min-w-[500px]">

                    {/* Mobile-only logo */}
                    <div className="flex justify-center mb-12 md:hidden">
                        <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
                    </div>

                    {/* Form Card */}
                    <div className="bg-white p-8 rounded-3xl border border-black/70">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl sm:text-[34px] text-left text-general-text font-bold">
                                    Forgot password?
                                </h2>
                                <p className="text-[#47464A] text-[16px] leading-relaxed">
                                    Enter your registered email address. We’ll send a verification code to your email app before allowing password reset
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-3 text-[#47464A] bg-[#F751511F] rounded-[12px] p-3 text-xs">
                                    <img src={alertIcon} alt="Alert" className="w-5 h-5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Email Field */}
                            <div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    label="Email / Username"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={email && !emailRegex.test(email) ? "border-red-400" : "mt-[25px]"}
                                    required
                                />
                                {email && !emailRegex.test(email) && (
                                    <p className="text-red-600 text-xs mt-2">Please enter a valid email address</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={!isButtonEnabled || loading}
                                className="w-full h-[45px] font-medium cursor-pointer"
                            >
                                {loading ? "Sending..." : "Send Reset Code"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Floating Footer - Always at bottom, overlays content */}
                <div className="absolute inset-x-0 bottom-6 md:bottom-8 px-6 pointer-events-none">
                    <p className="text-center text-sm text-gray-500 max-w-md mx-auto leading-relaxed pointer-events-auto">
                        Protected by reCAPTCHA and subject to the Rekntek{" "}
                        <Link to="/privacy-policy" className="underline text-[#24B99E] hover:text-[#24B99E]/80">
                            Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link to="/terms-of-service" className="underline text-[#24B99E] hover:text-[#24B99E]/80">
                            Terms of Service
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </main>
    );
}

export default ForgotPassword;
