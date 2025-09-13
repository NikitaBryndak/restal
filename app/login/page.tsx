import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function LoginPage() {
  return (
    <>
      <div className=" flex flex-wrap flex-col justify-center items-center min-h-screen">
        <div className="w-full max-w-md backdrop-blur-md rounded-lg shadow-xl/30 shadow-white/20 border border-white/10 bg-[--foreground]">
          <form
            id="login-form"
            className="space-y-4 p-6 flex flex-col justify-center items-center"
          >

            {/* Header */}
            <h1 className="text-5xl font-bold m-6">RestAll</h1>
            <p className="">Ваша подорож починається тут</p>

            {/* Form Fields */}
            <div>
              <Label htmlFor="username">Username:</Label>
              <Input type="text" id="username" name="username" required />
            </div>
            <div>
              <Label htmlFor="password">Password:</Label>
              <Input type="password" id="password" name="password" required />
            </div>
            <Button type="submit" variant="outline">Login</Button>
          </form>


          <hr className="w-full border-t border-gray-300/30 my-4" />

          {/* Footer */}
          <div className="mt-4 text-center mb-6">
            <p>Don't have an account? <a href="/register" className="text-blue-500 underline">Register here</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
