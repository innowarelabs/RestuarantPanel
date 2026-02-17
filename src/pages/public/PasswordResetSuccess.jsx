import { useNavigate } from "react-router-dom";
import Button from "../../elements/Button";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";

function PasswordResetSuccess() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar - hidden on mobile */}
            <AuthSidebar />

            {/* Right Side: Form - always dead-center vertically & horizontally */}
            <div className="flex-1 flex items-center justify-center bg-[#ffffff] px-4 sm:px-6 lg:px-8">

                <div className="w-full max-w-md">

                    {/* Mobile-only logo (adds consistent top spacing) */}
                    <div className="flex justify-center mb-12 md:hidden">
                        <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
                    </div>

                    <div className="bg-white p-8 rounded-3xl space-y-4 text-center">
                        <h2 className="text-lg sm:text-3xl text-general-text font-bold">
                            Password Successfully Updated.
                        </h2>

                        <p className="text-general-text/80 text-sm leading-relaxed">
                            Your password has been updated. You can now access the dashboard.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button
                                type="button"
                                onClick={() => { navigate('/login'); }}
                                className="w-full h-[48px]"
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default PasswordResetSuccess;
