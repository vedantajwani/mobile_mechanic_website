"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AuthCard from "../components/AuthCard";
import AuthForm from "../components/AuthForm";
import NavBar from "@/app/NavBar";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    console.log("handleLogin start");

    // 1) Log in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    console.log("auth result", { authData, authError });

    if (authError) {
      setError(authError.message);
      return;
    }

    const user = authData?.user;
    if (!user) {
      setError("No user returned from Supabase.");
      return;
    }

    // 2) Get profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setError("Error fetching profile: " + profileError.message);
      return;
    }

    const role = profile?.role;

    // 3) Redirect by role
    if (role) {
      router.push("/mechanic_landing");
    } else {
      console.log("→ CUSTOMER, /customer_landing");
      router.push("/customer_landing");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <AuthCard title="Log In">
        <AuthForm onSubmit={handleLogin} submitLabel="Log In" />
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="mt-4 text-center w-full">
          <p className="text-black">
            Do not have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold underline text-black"
            >
              Create one
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}
