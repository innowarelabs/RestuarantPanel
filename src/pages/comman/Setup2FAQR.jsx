import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import QRCode from "qrcode";
import AuthSidebar from "../../components/Auth/AuthSidebar";
import restaurantLogo from "../../assets/restaurant_logo.png";
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

function Setup2FAQR() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const onboardingStep = useSelector((state) => state.auth.onboardingStep);
  const restaurantName = useSelector((state) => state.auth.restaurantName);
  const userFromState = useSelector((state) => state.auth.user);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(true);
  const [error, setError] = useState("");
  const didRun = useRef(false);

  const { userId: userIdFromState } = location.state || {};
  const persistedUserId = localStorage.getItem("twoFAUserId");
  const effectiveUserId = userIdFromState || persistedUserId || userFromState?.id;

  const clearTwoFAStorage = () => {
    localStorage.removeItem("twoFAStatus");
    localStorage.removeItem("twoFANextRoute");
    localStorage.removeItem("twoFAUserId");
    localStorage.removeItem("twoFAGoto");
  };

  const navigateAfter2FA = () => {
    const goto = localStorage.getItem("twoFAGoto") || onboardingStep || "step1";
    clearTwoFAStorage();
    if (goto === "dashboard") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const loadSetupDetails = async () => {
      if (!effectiveUserId) {
        setError("User not found. Please login again.");
        setLoadingQR(false);
        return;
      }

      setLoadingQR(true);
      setError("");
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");

        const url = `${baseUrl.replace(/\/$/, "")}/api/v1/2fa/setup/${effectiveUserId}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        const contentType = res.headers.get("content-type");
        const data = contentType?.includes("application/json") ? await res.json() : await res.text();

        if (!res.ok) {
          const message =
            typeof data === "string"
              ? data
              : data?.message || data?.error || "Failed to load QR code. Please try again.";
          throw new Error(message);
        }

        const payload = extractPayload(data);
        const otpAuthUrl = payload?.qr_code_url || payload?.qrCodeUrl || payload?.qr_code;
        if (!otpAuthUrl) throw new Error("QR code URL not found in response");

        const dataUrl = await QRCode.toDataURL(otpAuthUrl);
        setQrCodeUrl(dataUrl);
      } catch (e) {
        setError(e?.message || "Failed to load QR code. Please try again.");
      } finally {
        setLoadingQR(false);
      }
    };

    loadSetupDetails();
  }, [accessToken, effectiveUserId]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!effectiveUserId) return;
    setLoading(true);
    setError("");
    try {
      const code = otp.join("");
      const baseUrl = import.meta.env.VITE_BACKEND_URL;
      if (!baseUrl) throw new Error("VITE_BACKEND_URL is missing");

      const url = `${baseUrl.replace(/\/$/, "")}/api/v1/2fa/verify/${effectiveUserId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ totp_code: code }),
      });

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json") ? await res.json() : await res.text();
      const payload = extractPayload(data);

      if (!res.ok) {
        const message =
          typeof data === "string" ? data : data?.message || data?.error || "Invalid code";
        throw new Error(message);
      }

      if (payload?.code === "2FA_409_ENABLED") {
        const updatedUser = userFromState ? { ...userFromState, is_2fa_enabled: true, is_2fa_setup: true } : null;
        dispatch(
          setSession({
            user: updatedUser,
            accessToken,
            onboardingStep,
            ...(restaurantName ? { restaurantName } : {}),
          })
        );
        navigateAfter2FA();
        return;
      }

      const access_token = payload?.access_token;
      const refresh_token = payload?.refresh_token;
      if (!access_token || !refresh_token) throw new Error("Verification failed. Please try again.");

      const updatedUser = userFromState ? { ...userFromState, is_2fa_enabled: true, is_2fa_setup: true } : null;
      dispatch(
        setSession({
          user: updatedUser,
          accessToken: access_token,
          refreshToken: refresh_token,
          onboardingStep,
          ...(restaurantName ? { restaurantName } : {}),
        })
      );
      navigateAfter2FA();
    } catch (err) {
      setError(err?.message || "Invalid Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <AuthSidebar />

      <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-6 relative">
        <div className="w-full max-w-xl z-10">
          <div className="flex justify-center mb-12 md:hidden">
            <img src={restaurantLogo} alt="Restaurant Logo" className="h-12 w-auto" />
          </div>

          <div className="bg-white p-2 sm:p-8 rounded-xl sm:rounded-3xl border border-black space-y-6 sm:max-h-[80vh] max-h-[70vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-general-text text-center md:text-left">
                Set Up Two-Factor Authentication
              </h1>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-[#24B99E] flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <p className="text-gray-700">
                    Download the Google Authenticator app for <span className="font-medium">iOS</span> or{" "}
                    <span className="font-medium">Android</span>
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-[#24B99E] flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <p className="text-gray-700">Scan the QR code below using the app.</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-[#24B99E] flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <p className="text-gray-700">Enter the 6-digit code shown in your app to confirm setup.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <div className="p-1 shadow-md bg-white rounded-2xl border border-gray-200">
                {loadingQR ? (
                  <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Loading QR code...</span>
                  </div>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-2xl" />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-red-500 text-sm text-center px-2">Failed to load QR code</span>
                  </div>
                )}
              </div>
            </div>

            <OTPInput otp={otp} setOtp={setOtp} onSubmit={handleSubmit} loading={loading} error={error} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-2 md:bottom-4 px-6 pointer-events-none">
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

export default Setup2FAQR;
