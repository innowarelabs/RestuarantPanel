import React from 'react';
import restaurantLogo from '../../assets/restaurant_logo.png';
import sslIcon from '../../assets/SignIn/shield.svg';
import verifiedIcon from '../../assets/SignIn/verifiedShield.svg';
import secureIcon from '../../assets/SignIn/secureShield.svg';

const AuthLayout = ({ children, imageType = 'charge' }) => {
    const leftContent = {
        charge: {
            heading: 'Take charge of your restaurant with ease',
            subheading:
                'Manage all your daily tasks from one seamless dashboard. Stay in control of orders, menus, staff, and more — effortlessly.',
        },
        manage: {
            heading: 'Manage your platform with control & clarity',
            subheading:
                'Oversee every restaurant, integration, and system from one intelligent command center.',
        },
    };

    const currentLeft = leftContent[imageType] || leftContent.charge;

    return (
        <div className="flex min-h-screen flex-col font-sans md:flex-row md:h-screen md:max-h-screen md:overflow-hidden">
            <aside className="hidden md:flex md:w-1/2 bg-primary text-white">
                <div className="relative flex h-screen w-full flex-col justify-center px-8 pb-24 lg:px-12">
                    <div className="flex items-center justify-center">
                        <div className="mx-auto w-full max-w-lg text-left">
                            <div className="mb-[14px] flex justify-start">
                                <img
                                    src={restaurantLogo}
                                    alt="Restaurant Logo"
                                    className="ml-[-10px] h-24 w-auto object-contain lg:h-[130px]"
                                />
                            </div>

                            <h1 className="mb-[10px] font-sans text-[36px] font-medium capitalize leading-[48px] tracking-normal text-white [leading-trim:none]">
                                {currentLeft.heading}
                            </h1>
                            <p className="font-sans text-[16px] font-medium not-italic leading-[100%] tracking-normal text-white [leading-trim:none]">
                                {currentLeft.subheading}
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-[110px] left-0 right-0 px-8 [@media(max-height:600px)]:bottom-[50px] lg:px-12">
                        <div className="mx-auto w-full max-w-lg">
                            <div className="flex h-[70px] flex-wrap items-center justify-center gap-6 rounded-xl bg-white text-sm">
                                <div className="flex items-center gap-2">
                                    <img src={sslIcon} alt="SSL" className="h-4 w-4" />
                                    <span className="text-black">256-bit SSL</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={verifiedIcon} alt="Verified" className="h-4 w-4" />
                                    <span className="text-black">Verified Providers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={secureIcon} alt="Secure" className="h-4 w-4" />
                                    <span className="text-black">Secure Platforms</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col bg-white md:min-h-0 md:h-full">
                <div className="h-full min-h-0 flex-1 overflow-y-auto">
                    <div className="flex min-h-full flex-col px-4 pt-4">
                        <div className="flex min-h-0 flex-1 items-center justify-center py-8 pb-4 md:py-12">
                            <div className="mx-auto w-full max-w-md xl:min-w-[500px]">
                                <div className="space-y-8 rounded-3xl border border-black/70 bg-white p-8 md:p-8">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
