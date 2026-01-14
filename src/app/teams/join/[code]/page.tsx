"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

export default function JoinTeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setCode(p.code));
  }, [params]);

  useEffect(() => {
    if (code) {
      fetchTeamInfo();
    }
  }, [code]);

  async function fetchTeamInfo() {
    try {
      const res = await fetch(`/api/teams/join/${code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Team not found");
        return;
      }

      setTeam(data.team);
    } catch {
      setError("Failed to load team info");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/teams/join/${code}`);
      return;
    }

    setJoining(true);
    setError("");

    try {
      const res = await fetch(`/api/teams/join/${code}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join team");
        return;
      }

      if (data.alreadyMember) {
        router.push(`/teams/${data.team.id}`);
        return;
      }

      setJoined(true);
      setTimeout(() => {
        router.push(`/teams/${data.team.id}`);
      }, 1500);
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
        <div className="w-8 h-8 border-2 border-[#6B21A8] border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (error && !team) {
    return (
      <main className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000] px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-[#A3A3A3] mb-6">{error}</p>
          <Link
            href="/teams"
            className="inline-block rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-3 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all"
          >
            Go to Teams
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 text-center">
          {joined ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome to the team!
              </h1>
              <p className="text-[#A3A3A3]">Redirecting...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[#6B21A8]/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#A855F7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                Join {team?.name}
              </h1>
              <p className="text-[#A3A3A3] mb-6">
                You&apos;ve been invited to join this team.
                <br />
                {team?.memberCount}{" "}
                {team?.memberCount === 1 ? "member" : "members"} already joined.
              </p>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              {status === "loading" ? (
                <div className="w-8 h-8 border-2 border-[#6B21A8] border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-3 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all disabled:opacity-50"
                >
                  {status !== "authenticated"
                    ? "Sign in to Join"
                    : joining
                      ? "Joining..."
                      : "Join Team"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
