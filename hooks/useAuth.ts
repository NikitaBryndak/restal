import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type AuthFormProps = {
  type: "login" | "register";
};
type AuthFormData = {
  name?: string;
  phoneNumber: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  referralCode?: string;
};

type RegistrationStep = "form" | "otp" | "complete";

export function useAuth({ type }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("form");
  const [pendingFormData, setPendingFormData] = useState<AuthFormData | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const sendOtp = async (phoneNumber: string) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, purpose: 'register' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send verification code");
    }
    return data;
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to verify code");
    }
    return data;
  };

  const handleAuth = async (formData: AuthFormData) => {
    setIsLoading(true);
    setError(undefined);

    try {
        if (type === 'register') {
            if (formData.password !== formData.confirmPassword) {
              setError("Паролі не співпадають");
              return;
            }

            // Check if user exists
            const resUserExists = await fetch('/api/userExists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
            });

            const { exists } = await resUserExists.json();
            if (exists) {
              setError("Користувач з цим номером вже існує. Будь ласка, увійдіть.");
              return;
            }

            // Save form data and send OTP
            setPendingFormData(formData);

            await sendOtp(formData.phoneNumber);
            setOtpSent(true);
            setRegistrationStep("otp");
            return; // Wait for OTP verification
        }

        // Login flow
        const resLogin = await signIn("credentials", {
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            redirect: false
        });

        if (resLogin?.error) {
            const errorMessage = resLogin.error === "CredentialsSignin"
              ? "Невірний номер телефону або пароль"
              : resLogin.error;
            setError(errorMessage);
            return;
        }

        router.push("/dashboard/profile");
    } catch (err: any) {
      setError(err.message || `Помилка під час ${type === 'register' ? 'реєстрації' : 'входу'}. Спробуйте ще раз.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!pendingFormData) {
      setError("Дані реєстрації не знайдені. Спробуйте ще раз.");
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Verify OTP
      await verifyOtp(pendingFormData.phoneNumber, otp);

      // OTP verified — now register the user
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pendingFormData.name,
          phoneNumber: pendingFormData.phoneNumber,
          email: pendingFormData.email,
          password: pendingFormData.password,
          referralCode: pendingFormData.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Помилка реєстрації");
        return;
      }

      // Auto-login after successful registration
      const resLogin = await signIn("credentials", {
        phoneNumber: pendingFormData.phoneNumber,
        password: pendingFormData.password,
        redirect: false,
      });

      if (resLogin?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login");
        return;
      }

      router.push("/dashboard/profile");
    } catch (err: any) {
      setError(err.message || "Помилка підтвердження коду. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingFormData) return;

    setIsLoading(true);
    setError(undefined);

    try {
      await sendOtp(pendingFormData.phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Помилка надсилання коду. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setRegistrationStep("form");
    setOtpSent(false);
    setError(undefined);
  };

  return {
    isLoading,
    error,
    handleAuth,
    registrationStep,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToForm,
    pendingPhoneNumber: pendingFormData?.phoneNumber,
  };
}