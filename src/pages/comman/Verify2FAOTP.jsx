import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
import googleAuthAppLogo from "../../assets/General/googleAuthApp.svg";
import OTPInput from "../../elements/OTPInput";
import { setSession } from "../../redux/store";

const extractPayload = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    try {
      return extractPayload(JSON.parse(text));
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object") return null;
  const nested = raw?.data?.data && typeof raw.data.data === "object" ? raw.data.data : null;
  const top = raw?.data && typeof raw.data === "object" ? raw.data : null;
  return nested || top || raw;
};

function Verify2FAOTP() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hasRedirectedRef = useRef(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accessToken = useSelector((state) => state.auth.accessToken);
  const onboardingStep = useSelector((state) => state.auth.onboardingStep);
  const restaurantName = useSelector((state) => state.auth.restaurantName);
  const userFromState = useSelector((state) => state.auth.user);

  const routeEmail = location.state?.email;
  const routePassword = location.state?.password;
  const persistedEmail = sessionStorage.getItem("twoFAEmail");
  const persistedPassword = sessionStorage.getItem("twoFAPassword");
  const email = typeof routeEmail === "string" && routeEmail.trim() ? routeEmail.trim() : persistedEmail;
  const password = typeof routePassword === "string" && routePassword.trim() ? routePassword : persistedPassword;

  const clearTwoFAStorage = useCallback(() => {
    localStorage.removeItem("twoFAStatus");
    localStorage.removeItem("twoFANextRoute");
    localStorage.removeItem("twoFAUserId");
    localStorage.removeItem("twoFAGoto");
    sessionStorage.removeItem("twoFAEmail");
    sessionStorage.removeItem("twoFAPassword");
  }, []);

  const navigateAfter2FA = useCallback(
    (gotoValue) => {
      const goto = typeof gotoValue === "string" && gotoValue.trim() ? gotoValue.trim() : onboardingStep || "step1";
      clearTwoFAStorage();
      if (goto === "dashboard") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    },
    [clearTwoFAStorage, navigate, onboardingStep]
  );

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    const isTwoFAPending = localStorage.getItem("twoFAStatus") === "pending";
    if (!isTwoFAPending) {
      const existingToken = typeof accessToken === "string" ? accessToken.trim() : "";
      if (existingToken) {
        const storedGoto = localStorage.getItem("onboardingStep");
        navigateAfter2FA(storedGoto || onboardingStep);
      }
    }
  }, [accessToken, navigateAfter2FA, onboardingStep]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError("");
    try {
      const code = otp.join("");
      const baseUrl = import.meta.env.VITE_BACKEND_URL;
      if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");

      if (!email || !password) throw new Error("Session expired. Please login again.");

      const url = `${baseUrl.replace(/\/$/, "")}/api/v1/auth/login`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totp_code: code, trust_device: false }),
      });

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json") ? await res.json() : await res.text();

      console.log("---res---", res);
      console.log("---data---", data);

      if (!res.ok) {
        const message =
          typeof data === "string" ? data : data?.message || data?.error || "Verification failed. Please try again.";
        throw new Error(message);
      }

      if (typeof data !== "object" || !data) throw new Error("Invalid verification response");
      if (data.code !== "AUTH_200") throw new Error(data.message || "Verification failed. Please try again.");

      const sessionData = data.data || extractPayload(data);
      const access_token = sessionData?.access_token;
      const refresh_token = sessionData?.refresh_token;
      console.log('---goto---', sessionData?.goto);
      const nextGoto = sessionData?.goto || onboardingStep || "step1";
      const nextExpiresIn = sessionData?.expires_in;
      const updatedUser = sessionData?.user
        ? { ...sessionData.user, is_2fa_enabled: true, is_2fa_setup: true }
        : userFromState
          ? { ...userFromState, is_2fa_enabled: true, is_2fa_setup: true }
          : null;

      if (!access_token || !refresh_token) throw new Error("Verification failed. Please try again.");

      dispatch(
        setSession({
          user: updatedUser,
          accessToken: access_token,
          refreshToken: refresh_token,
          onboardingStep: nextGoto,
          accessTokenExpiresIn: nextExpiresIn,
          ...(restaurantName ? { restaurantName } : {}),
        })
      );
      const restaurantId =
        typeof sessionData?.user?.restaurant_id === "string"
          ? sessionData.user.restaurant_id
          : typeof updatedUser?.restaurant_id === "string"
            ? updatedUser.restaurant_id
            : typeof updatedUser?.id === "string"
              ? updatedUser.id
              : "";
      if (restaurantId) localStorage.setItem("restaurant_id", restaurantId);

      hasRedirectedRef.current = true;
      navigateAfter2FA(nextGoto);
    } catch (err) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AuthSidebar />

      <main className="flex-1 bg-[#ffffff] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-md mx-auto z-10 xl:min-w-[500px]">
          <div className="md:hidden flex justify-center p-4 mb-6">
            <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/70 space-y-6 sm:max-h-full">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-[34px] font-bold text-center text-general-text">
                Two-Factor Verification
              </h1>

              <p className="text-center text-[#47464A] text-[16px] leading-relaxed">
                Enter the 6-digit code from your Google Authenticator app to verify your identity.
              </p>
            </div>

            <div className="flex justify-center">
              <img
                src={googleAuthAppLogo}
                alt="Google Authenticator App"
                className="w-40 h-40 object-contain"
              />
            </div>

            <OTPInput otp={otp} setOtp={setOtp} onSubmit={handleSubmit} loading={loading} error={error} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 md:bottom-8 px-6 pointer-events-none">
          <p className="text-center text-sm text-gray-500 max-w-md mx-auto leading-relaxed pointer-events-auto">
            Protected by reCAPTCHA and subject to the Rekntek{" "}
            <a href="/privacy-policy" className="underline text-[#24B99E] hover:text-[#24B99E]/80">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms-of-service" className="underline text-[#24B99E] hover:text-[#24B99E]/80">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default Verify2FAOTP;
