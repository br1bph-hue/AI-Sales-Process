import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { BrandFooter } from "@/components/footer";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <p className="text-dsg-navy text-sm font-semibold tracking-widest uppercase">
              DSG
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-dsg-gray-900 tracking-tight">
              Distribution Sales OS
            </h1>
            <p className="mt-3 text-sm text-dsg-gray-500">
              Sign in with your work email. We'll send a one-time link.
            </p>
          </div>
          <Suspense fallback={<div className="dsg-card p-8" />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
