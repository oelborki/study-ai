import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import InviteLinkSection from "./InviteLinkSection";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { teamId } = await params;

  // Check if user is a member
  const membership = await db.query.teamMembers.findFirst({
    where: and(
      eq(schema.teamMembers.teamId, teamId),
      eq(schema.teamMembers.userId, session.user.id)
    ),
  });

  if (!membership) {
    notFound();
  }

  // Get team info
  const team = await db.query.teams.findFirst({
    where: eq(schema.teams.id, teamId),
  });

  if (!team) {
    notFound();
  }

  // Get all members with user info
  const members = await db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.teamId, teamId),
  });

  const membersWithInfo = await Promise.all(
    members.map(async (m) => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, m.userId),
      });
      return {
        ...m,
        name: user?.name || user?.email || "Unknown",
        email: user?.email || "",
        image: user?.image,
      };
    })
  );

  // Get team decks
  const decks = await db.query.decks.findMany({
    where: eq(schema.decks.teamId, teamId),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  });

  const isOwner = membership.role === "owner";

  return (
    <main className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Teams
          </Link>
          <h1 className="text-3xl font-bold text-white">{team.name}</h1>
          <p className="mt-1 text-[#A3A3A3]">
            {membersWithInfo.length}{" "}
            {membersWithInfo.length === 1 ? "member" : "members"} &middot;{" "}
            {decks.length} {decks.length === 1 ? "deck" : "decks"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Decks */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Team Decks
              </h2>
              {decks.length === 0 ? (
                <div className="rounded-xl border border-[#404040] bg-[#121212] p-8 text-center">
                  <p className="text-[#A3A3A3]">
                    No decks shared with this team yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {decks.map((deck) => (
                    <Link
                      key={deck.id}
                      href={`/deck/${deck.id}`}
                      className="group rounded-xl border border-[#404040] bg-[#121212] p-4 hover:border-[#6B21A8] transition-all"
                    >
                      <h3 className="font-medium text-white group-hover:text-[#A855F7] transition-colors mb-1 truncate">
                        {deck.title}
                      </h3>
                      <p className="text-sm text-[#737373]">
                        {deck.fileType?.toUpperCase()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invite Link */}
            {isOwner && (
              <InviteLinkSection inviteCode={team.inviteCode} />
            )}

            {/* Members */}
            <section className="rounded-xl border border-[#404040] bg-[#121212] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Members</h2>
              <div className="space-y-3">
                {membersWithInfo.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                  >
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#6B21A8] flex items-center justify-center text-xs text-white font-semibold">
                        {member.name[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-[#737373] truncate">
                        {member.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        member.role === "owner"
                          ? "bg-[#6B21A8]/20 text-[#A855F7]"
                          : "bg-[#2D2D2D] text-[#A3A3A3]"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
