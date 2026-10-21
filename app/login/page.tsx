import BrandLogo from "@/app/ui/brand-logo";
import LoginForm from "@/app/ui/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-100 flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-10 w-full items-end rounded-lg bg-gray-200 p-3 md:h-18">
          <div className="w-32 md:w-36">
            <BrandLogo />
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
