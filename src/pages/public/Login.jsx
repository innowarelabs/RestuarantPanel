import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Button from "../../elements/Button";
import PasswordInput from "../../elements/PasswordInput";
import TextInput from "../../elements/TextInput";
import restaurantLogo from "../../assets/restaurant_logo.png";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import { login } from "../../redux/store";

function Login() {
    const dispatch = useDispatch();

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
            console.log("Logging in with:", { email, password });

            // Dispatch to store - Redux now handles localStorage
            dispatch(login({ name: "John's Burger House", email }));

            // App.jsx will automatically redirect to dashboard when user state changes
        } catch (error) {
            setError(error?.error || error?.message || "Login failed. Please try again.");
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
