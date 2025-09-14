import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type AuthFormProps = {
  type: "login" | "register";
};
type AuthFormData = {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};  

export function useAuth({ type }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleAuth = async (formData: AuthFormData) => {
    setIsLoading(true);
    setError(undefined);

    try {
        if (type === 'register') {
            console.log(formData);
            if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
            }

            // Check if user exists
            const resUserExists = await fetch('/api/userExists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: formData.email }),
            });
            
            const { exists } = await resUserExists.json();
            if (exists) {
            setError("User with this email already exists. Please log in.");
            return;
            }

            // Register user
            const res = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                password: formData.password
            }),
            });

            const data = await res.json();


            if (!res.ok) {
            setError(data.message || "Registration failed");
            return;
            }
        }

        const resLogin = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false
        });

        if (resLogin?.error) {
            const errorMessage = resLogin.error === "CredentialsSignin" 
            ? "Invalid email or password"
            : resLogin.error;
            setError(errorMessage);
            return;
        }
        

      router.push("/dashboard");
    } catch (err) {
      setError(`An error occurred during ${type}. Please try again.`);
      console.error(`${type} error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleAuth
  };
}