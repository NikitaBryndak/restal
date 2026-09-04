
import { AuthForm } from "@/components/auth/auth-form";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";


export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  // Prefill the referral code from a shared link (/register?ref=REF-XXXX-XXXX).
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.trim().toUpperCase() : "";
  const initialReferralCode = /^REF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(ref) ? ref : undefined;

  return <AuthForm type="register" initialReferralCode={initialReferralCode} />;
}
