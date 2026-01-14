import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import CreateTeamButton from "./CreateTeamButton";

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const memberships = await db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.userId, session.user.id),
  });

  const teams = await Promise.all(
    memberships.map(async (m) => {
      const team = await db.query.teams.findFirst({
        where: eq(schema.teams.id, m.teamId),
      });

      // Count members
      const members = await db.query.teamMembers.findMany({
        where: eq(schema.teamMembers.teamId, m.teamId),
      });

      return team
        ? { ...team, role: m.role, memberCount: members.length }
        : null;
    })
  );

  const validTeams = teams.filter(Boolean);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Teams</h1>
            <p className="mt-1 text-[#A3A3A3]">
              {validTeams.length} {validTeams.length === 1 ? "team" : "teams"}
            </p>
          </div>
          <CreateTeamButton />
        </div>

        {validTeams.length === 0 ? (
          <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#737373]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No teams yet
            </h2>
            <p className="text-[#A3A3A3] mb-6">
              Create a team to share decks with others, or join an existing team
              with an invite link.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {validTeams.map((team) => (
              <Link
                key={team!.id}
                href={`/teams/${team!.id}`}
                className="group rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 hover:border-[#6B21A8] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#6B21A8]/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#A855F7]"
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      team!.role === "owner"
                        ? "bg-[#6B21A8]/20 text-[#A855F7]"
                        : "bg-[#2D2D2D] text-[#A3A3A3]"
                    }`}
                  >
                    {team!.role}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#A855F7] transition-colors">
                  {team!.name}
                </h3>

                <p className="text-sm text-[#737373]">
                  {team!.memberCount}{" "}
                  {team!.memberCount === 1 ? "member" : "members"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
