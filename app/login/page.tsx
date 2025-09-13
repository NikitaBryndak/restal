import "./login.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <>
      <div className="login-container center-content">
        <form id="login-form">
          <h1>Login</h1>
          <div>
            <Label htmlFor="username">Username:</Label>
            <Input type="text" id="username" name="username" required />
          </div>
          <div>
            <Label htmlFor="password">Password:</Label>
            <Input type="password" id="password" name="password" required />
          </div>
          <Button type="submit">Login</Button>
        </form>
      </div>
    </>
  );
}
