import React from 'react';
import restaurantLogo from '../../assets/restaurant_logo.png';
import sslIcon from '../../assets/SignIn/shield.svg';
import verifiedIcon from '../../assets/SignIn/verifiedShield.svg';
import secureIcon from '../../assets/SignIn/secureShield.svg';

const AuthLayout = ({ children, imageType = 'charge' }) => {
    const leftContent = {
        charge: {
            heading: "Take Charge Of Your Restaurant With Ease",
            subheading: "Manage all your daily tasks from one seamless dashboard. Stay in control of orders, menus, staff, and more — effortlessly."
        },
        manage: {
            heading: "Manage Your Platform With Control & Clarity",
            subheading: "Oversee every restaurant, integration, and system from one intelligent command center."
        }
    };

    const currentLeft = leftContent[imageType] || leftContent.charge;

    return (
        <div className="flex flex-col md:flex-row min-h-screen font-avenir">
            {/* Left Side - Teal Background */}
            <div className="hidden md:flex md:w-1/2 bg-[#24B99E] text-white overflow-hidden">
                <div className="flex flex-col justify-center h-screen px-8 lg:px-12 w-full relative pb-24">
                    {/* Main content block - vertically centered */}
                    <div className="flex items-center justify-start">
                        <div className="max-w-lg text-left w-full">
                            {/* Logo */}
                            <div className="flex justify-start mb-[14px]">
                                <img
                                    src={restaurantLogo}
                                    alt="Restaurant Logo"
                                    className="h-24 lg:h-[130px] w-auto object-contain ml-[-10px]"
                                />
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-[36px] lg:text-3xl xl:text-4xl font-medium leading-snug mb-[10px]">
                                {currentLeft.heading}
                            </h1>

                            {/* Subheading */}
                            <p className="text-white text-[16px] lg:text-base font-medium leading-relaxed">
                                {currentLeft.subheading}
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges - absolutely positioned at bottom */}
                    <div className="absolute bottom-[110px] [@media(max-height:600px)]:bottom-[50px] left-0 right-0 px-8 lg:px-12">
                        <div className="max-w-[463px] w-full">
                            <div className="bg-white rounded-xl h-[70px] flex items-center justify-between px-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <img src={sslIcon} alt="SSL" className="w-4 h-4" />
                                    <span className="text-black text-[12px]">256-bit SSL</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={verifiedIcon} alt="Verified" className="w-4 h-4" />
                                    <span className="text-black text-[12px]">Verified Providers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={secureIcon} alt="Secure" className="w-4 h-4" />
                                    <span className="text-black text-[12px]">Secure Platforms</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-[52%] bg-white flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-[530px]">
                    <div className="bg-white rounded-[24px] border border-[#000000B2] p-8 md:p-10 ">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
