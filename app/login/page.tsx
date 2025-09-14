import { AuthForm } from "@/components/auth/auth-form";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return <AuthForm type="login"/>;
}
