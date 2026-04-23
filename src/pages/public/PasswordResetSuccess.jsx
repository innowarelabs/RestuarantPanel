import { useNavigate } from "react-router-dom";
import Button from "../../elements/Button";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";

function PasswordResetSuccess() {
    const navigate = useNavigate();

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

                                <div className="space-y-8 rounded-3xl border border-black/70 bg-white p-8 text-center">
                                    <h2 className="font-sans text-[36px] font-bold not-italic leading-[100%] tracking-normal text-[#202020] [leading-trim:none]">
                                        Password successfully updated.
                                    </h2>
                                    <p className="font-sans text-[16px] leading-relaxed text-[#47464A]">
                                        Your password has been updated. You can now access the dashboard.
                                    </p>
                                    <div className="flex flex-col items-stretch justify-center gap-4 pt-2 sm:items-center">
                                        <Button
                                            type="button"
                                            variant="signIn"
                                            onClick={() => navigate("/login")}
                                            className="w-full max-w-md !h-[48px] !rounded-[12px] font-sans !text-[18px] !font-bold !text-white sm:w-[206px]"
                                        >
                                            Go to Sign In
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default PasswordResetSuccess;
