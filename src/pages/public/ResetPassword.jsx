import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import alertIcon from '../../assets/General/alert.svg';
import Button from "../../elements/Button";
import PasswordInput from "../../elements/PasswordInput";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import tick from "../../assets/General/tick.svg";
import cross from "../../assets/General/cross.svg";
import circleCheck from '../../assets/General/circleCheck(green).svg';

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const { reset_token: token } = location.state || {};

    const [error, setError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState("");

    // Password strength rules
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const passwordsMatch = newPassword === repeatPassword && repeatPassword !== "";

    const isFormValid =
        hasMinLength &&
        hasNumber &&
        hasUppercase &&
        hasSpecialChar &&
        passwordsMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Simulation of reset password
            console.log("Resetting password with token:", token);

            setAlert("Password Reset!");
            setTimeout(() => { setAlert("Redirecting!"); }, 1000);
            setTimeout(() => { navigate("/password-reset-success", { replace: true }); }, 2000);
        } catch (error) {
            setAlert("");
            setError(error?.error || error?.message || "Password reset failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar */}
            <AuthSidebar />

            {/* Right Side - Full height + relative for absolute footer */}
            <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-4 relative">

                {/* Centered Form - completely unaffected by footer */}
                <div className="w-full max-w-md z-10 xl:min-w-[500px]">

                    {/* Mobile Logo */}
                    <div className="flex justify-center mb-12 md:hidden">
                        <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
                    </div>

                    {/* Form Card */}
                    <div className="bg-white p-8 rounded-3xl border border-black/70">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl sm:text-[34px] text-left text-general-text font-bold">
                                    Reset password
                                </h2>

                                <p className="text-[#47464A] text-[16px] leading-relaxed">
                                    Please create a new password that you don’t use on any other site.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 text-[#47464A] bg-[#F751511F] rounded-lg p-3 text-xs">
                                    <img src={alertIcon} alt="Alert" className="w-5 h-5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    {/* New Password */}
                                    <PasswordInput
                                        id="new-password"
                                        label="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                    />

                                    {/* Password Strength Rules */}
                                    {newPassword && (
                                        <div className="space-y-1">
                                            {hasMinLength && hasNumber && hasUppercase && hasSpecialChar ? null : (
                                                <p className="text-sm font-medium text-red-600">Weak Password</p>
                                            )}
                                            {[
                                                { condition: hasMinLength, text: "At least 8 characters" },
                                                { condition: hasNumber, text: "Contains a number" },
                                                { condition: hasUppercase, text: "Contains an uppercase letter" },
                                                { condition: hasSpecialChar, text: "Contains a special character (!@#$ etc.)" },
                                            ].map((rule, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 text-xs ${rule.condition ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    <img src={rule.condition ? tick : cross} alt="" className="w-4 h-4" />
                                                    <span>{rule.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {/* Repeat Password */}
                                    <PasswordInput
                                        id="repeat-password"
                                        label="Confirm New Password"
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        placeholder="Repeat your password"
                                        required
                                    />

                                    {repeatPassword && (
                                        <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                                            <img src={passwordsMatch ? tick : cross} alt="" className="w-4 h-4" />
                                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={!isFormValid || loading}
                                className="w-full text-lg font-medium h-[48px]"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </Button>

                            {alert && (
                                <div className="flex justify-center">
                                    <div className="flex items-center gap-3 text-general-text bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                        <img src={circleCheck} alt="Success" className="w-5 h-5" />
                                        <p>{alert}</p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Floating Footer - Always at bottom of screen */}
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

export default ResetPassword;
