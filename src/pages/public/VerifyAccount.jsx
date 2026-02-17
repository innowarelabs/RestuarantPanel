import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthSidebar from '../../components/Auth/AuthSidebar';
import restaurantLogo from '../../assets/restaurant_logo.png';
import Button from '../../elements/Button';

const VerifyAccount = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "******891";

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length === 6) {
            console.log('Verifying code', otpValue);
            navigate('/reset-password', { state: { reset_token: 'dummy_token' } });
        }
    };

    const isComplete = otp.every(v => v !== '');

    return (
        <main className="min-h-screen flex flex-col md:flex-row">
            <AuthSidebar />

            <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-4 relative">
                <div className="w-full max-w-md z-10 xl:min-w-[500px]">
                    {/* Mobile Logo */}
                    <div className="flex justify-center mb-12 md:hidden">
                        <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-black/70 space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-[34px] text-left text-general-text font-bold">
                                Verify Your Account
                            </h2>
                            <p className="text-[#47464A] text-[16px] leading-relaxed">
                                We've sent a code to {email}. Enter that code to confirm your account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="flex justify-between gap-2 sm:gap-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className={`w-[42px] h-[50px] sm:w-[62px] sm:h-[62px] text-center text-[20px] sm:text-[24px] font-bold border rounded-[10px] sm:rounded-[12px] focus:outline-none transition-all bg-white text-[#1F2937] ${digit ? 'border-[#24B99E]' : 'border-[#DCDBDD]'
                                            } focus:border-[#24B99E] focus:ring-1 focus:ring-[#24B99E]`}
                                    />
                                ))}
                            </div>

                            <div className="space-y-6">
                                <Button
                                    type="submit"
                                    disabled={!isComplete}
                                    className="w-full h-[48px] font-bold text-[18px]"
                                >
                                    Continue
                                </Button>
                                <p className="text-center text-[14px] font-[400] text-[#47464A]">
                                    Didn't Get The Code? <button type="button" className="text-[#202020] font-bold hover:underline ml-1">Resend</button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default VerifyAccount;
