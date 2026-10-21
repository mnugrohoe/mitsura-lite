"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { authenticate } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction, pending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your username and password</CardDescription>
      </CardHeader>

      {/* form now wraps content AND footer */}
      <form action={formAction}>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <InputGroup className="overflow-hidden">
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex-col gap-2">
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
