import React from 'react';
import { useLocation } from 'react-router-dom';
import restaurantLogo from '../../assets/restaurant_logo.png';
import shield from '../../assets/SignIn/shield.svg';
import verifiedShield from '../../assets/SignIn/verifiedShield.svg';
import secureShield from '../../assets/SignIn/secureShield.svg';

function AuthSidebar() {
    const location = useLocation();

    // Check which content to show based on the current path
    const isMainAuthPage = ['/login', '/verify-account'].includes(location.pathname);

    return (
        <aside className="hidden md:flex md:w-1/2 bg-primary text-white">
            <div className="flex flex-col justify-center h-screen px-8 lg:px-12 w-full relative pb-24">

                {/* Main content block - vertically centered */}
                <div className="flex items-center justify-center">
                    <div className="max-w-lg mx-auto text-left w-full">
                        {/* Logo */}
                        <div className="flex justify-start mb-[14px]">
                            <img
                                src={restaurantLogo}
                                alt="Restaurant Logo"
                                className="h-24 lg:h-[140px] w-auto object-contain ml-[-10px]" // Use snippet spacing
                            />
                        </div>

                        {/* Heading & Subheading - Conditional */}
                        {isMainAuthPage ? (
                            <>
                                {/* Heading for Login & Verify */}
                                <h1 className="text-[36px] lg:text-3xl xl:text-4xl font-medium leading-[1.3] mb-[15px]">
                                    <span className="block mb-2">Take charge of your</span>
                                    <span className="block">restaurant with ease</span>
                                </h1>

                                {/* Subheading for Login & Verify */}
                                <p className="text-white text-[16px] lg:text-base font-medium leading-relaxed">
                                    Manage all your daily tasks from one seamless dashboard. Stay in <br /> control of orders, menus, staff, and more — effortlessly.
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Heading for Forgot Password, Reset, etc. */}
                                <h1 className="text-[36px] lg:text-3xl xl:text-4xl font-medium leading-[1.3] mb-[15px]">
                                    Manage your platform with <br /> control & clarity
                                </h1>

                                {/* Subheading for Forgot Password, Reset, etc. */}
                                <p className="text-white text-[16px] lg:text-base font-medium leading-relaxed">
                                    Oversee every restaurant, integration, and system from one intelligent command center.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Trust Badges - absolutely positioned at bottom */}
                <div className="absolute bottom-[110px] [@media(max-height:600px)]:bottom-[50px] left-0 right-0 px-8 lg:px-12">
                    <div className="max-w-lg mx-auto w-full">
                        <div className="bg-white rounded-xl h-[70px] flex flex-wrap items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <img src={shield} alt="SSL" className="w-4 h-4" />
                                <span className="text-black">256-bit SSL</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img src={verifiedShield} alt="Verified" className="w-4 h-4" />
                                <span className="text-black">Verified Providers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img src={secureShield} alt="Secure" className="w-4 h-4" />
                                <span className="text-black">Secure Platforms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default AuthSidebar;
