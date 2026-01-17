import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, or, inArray } from "drizzle-orm";
import DeckCard from "@/components/dashboard/DeckCard";
import DashboardActions from "@/components/dashboard/DashboardActions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get user's team memberships
  const memberships = await db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.userId, userId),
  });
  const teamIds = memberships.map((m) => m.teamId);

  // Get personal decks + team decks
  let decks;
  if (teamIds.length > 0) {
    decks = await db.query.decks.findMany({
      where: or(
        eq(schema.decks.userId, userId),
        inArray(schema.decks.teamId, teamIds)
      ),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
  } else {
    decks = await db.query.decks.findMany({
      where: eq(schema.decks.userId, userId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Decks</h1>
            <p className="mt-1 text-[#A3A3A3]">
              {decks.length} {decks.length === 1 ? "deck" : "decks"} total
            </p>
          </div>
          <DashboardActions />
        </div>

        {decks.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No decks yet</h2>
            <p className="text-[#A3A3A3] mb-6">
              Create a deck manually or upload a PowerPoint/PDF to get started
            </p>
            <DashboardActions />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
