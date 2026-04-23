import React from 'react';
import { useLocation } from 'react-router-dom';
import restaurantLogo from '../../assets/restaurant_logo.png';
import shield from '../../assets/SignIn/shield.svg';
import verifiedShield from '../../assets/SignIn/verifiedShield.svg';
import secureShield from '../../assets/SignIn/secureShield.svg';

function AuthSidebar() {
    const location = useLocation();
    const isMainAuthPage = ['/login', '/verify-account'].includes(location.pathname);

    return (
        <aside className="hidden md:flex md:w-1/2 bg-primary text-white">
            <div className="flex flex-col justify-center h-screen px-8 lg:px-12 w-full relative pb-24">
                <div className="flex items-center justify-center">
                    <div className="max-w-lg mx-auto text-left w-full">
                        <div className="flex justify-start mb-[14px]">
                            <img
                                src={restaurantLogo}
                                alt="Restaurant Logo"
                                className="h-24 lg:h-[130px] w-auto object-contain ml-[-10px]"
                            />
                        </div>

                        {isMainAuthPage ? (
                            <>
                                <h1 className="mb-[10px] font-sans text-[36px] font-medium capitalize leading-[48px] tracking-normal text-white [leading-trim:none]">
                                    Take charge of your restaurant with ease
                                </h1>
                                <p className="font-sans text-[16px] font-medium not-italic leading-[100%] tracking-normal text-white [leading-trim:none]">
                                    Manage all your daily tasks from one seamless dashboard. Stay in control of orders,
                                    menus, staff, and more — effortlessly.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="mb-[10px] font-sans text-[36px] font-medium capitalize leading-[48px] tracking-normal text-white [leading-trim:none]">
                                    Manage your platform with control & clarity
                                </h1>
                                <p className="font-sans text-[16px] font-medium not-italic leading-[100%] tracking-normal text-white [leading-trim:none]">
                                    Oversee every restaurant, integration, and system from one intelligent command
                                    center.
                                </p>
                            </>
                        )}
                    </div>
                </div>

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
