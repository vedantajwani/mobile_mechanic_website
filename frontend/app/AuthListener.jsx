"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // update adjust path to client
import { useAuth } from "@/app/AuthContext";

export default function AuthListener() {
  const router = useRouter();
  const { setUser, setLoading } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("AuthListener: error getting session", error);
          setUser(null);
          return;
        }

        if (!session?.user) {
          setUser(null);
          return;
        }

        const userID = session.user.id;
        const userEmail = session.user.email ?? "";

        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, full_name, phone_number")
            .eq("id", userID)
            .maybeSingle();

          if (!isMounted) return;

          if (profileError) {
            console.error("AuthListener: error fetching profile", profileError);
            setUser({
              id: userID,
              email: userEmail,
              isMechanic: false,
              fullName: null,
              phone: null,
            });
            return;
          }

          const rawRole = profile?.role;
          const isMechanic =
            rawRole === true ||
            rawRole === "true" ||
            rawRole === 1 ||
            rawRole === "1";

          setUser({
            id: userID,
            email: userEmail,
            isMechanic,
            fullName: profile?.full_name ?? null,
            phone: profile?.phone ?? null,
          });
        } catch (err) {
          console.error("AuthListener: unexpected error in profile fetch", err);
          setUser({
            id: userID,
            email: userEmail,
            isMechanic: false,
            fullName: null,
            phone: null,
          });
        }
      } catch (err) {
        console.error("AuthListener: unexpected error in init", err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("AuthListener: loading -> false");
        }
      }
    };

    init();

    // listening for login or log out 
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const userID = session.user.id;
          const userEmail = session.user.email ?? "";

          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role, full_name, phone_number")
              .eq("id", userID)
              .maybeSingle();

            if (profileError) {
              console.error(
                "AuthListener: error fetching profile on SIGNED_IN",
                profileError
              );
              setUser({
                id: userID,
                email: userEmail,
                isMechanic: false,
                fullName: null,
                phone: null,
              });
            } else {
              const rawRole = profile?.role;
              const isMechanic =
                rawRole === true ||
                rawRole === "true" ||
                rawRole === 1 ||
                rawRole === "1";

              setUser({
                id: userID,
                email: userEmail,
                isMechanic,
                fullName: profile?.full_name ?? null,
                phone: profile?.phone ?? null,
              });

              await redirectByRole(isMechanic, router);
            }
          } catch (err) {
            console.error("AuthListener: unexpected error on SIGNED_IN", err);
            setUser({
              id: userID,
              email: userEmail,
              isMechanic: false,
              fullName: null,
              phone: null,
            });
          }
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          router.push("/");
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router, setUser, setLoading]);

  return null;
}

// fetches profile.role from Supabase
// select role true is our mechanic
async function redirectByRole(isMechanic, router) {
  if (isMechanic) {
    console.log("Role treated as MECHANIC → /mechanic_landing");
    router.push("/mechanic_landing");
  } else {
    console.log("Role treated as CUSTOMER → /customer_landing");
    router.push("/customer_landing");
  }
}
