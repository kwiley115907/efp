"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { listenForAuth, signOutUser } from "../lib/auth";
import FloorPlanBuilder from "../components/FloorPlanBuilder";

export default function DashboardPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialDraft, setInitialDraft] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const unsub = listenForAuth(async (user) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      if (!mounted) return;

      setUid(user.uid);
      setEmail(user.email || "");

      try {
        const snap = await getDoc(doc(db, "plans", user.uid));
        if (!mounted) return;
        setInitialDraft(snap.exists() ? snap.data().draft ?? null : null);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setInitialDraft(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [router]);

  async function handleLogout() {
    await signOutUser();
    router.push("/sign-in");
  }

  if (loading) {
    return <main className="p-6">Loading dashboard...</main>;
  }

  return (
    <main className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h1 className="text-2xl font-bold">Your Dashboard</h1>
          <p className="text-sm text-gray-600">{email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl bg-gray-200 px-4 py-2 text-gray-900"
        >
          Sign Out
        </button>
      </div>

      <FloorPlanBuilder userId={uid} initialDraft={initialDraft} />
    </main>
  );
}
