import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getStorage, getStorageKey } from "@/lib/storage";
import GenerateButtons from "./GenerateButtons";

export default async function DeckPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Query database to get deck info
    const deck = await db.query.decks.findFirst({
        where: eq(schema.decks.id, id),
    });

    if (!deck) {
        notFound();
    }

    // Check authorization
    const session = await auth();

    // Not logged in - show 403
    if (!session?.user?.id) {
        return (
            <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#0a1a1f] via-[#000000] to-[#000000]">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white">403</h1>
                    <p className="mt-4 text-xl text-[#A3A3A3]">You need to be logged in to view this deck.</p>
                    <a
                        href="/login"
                        className="mt-6 inline-block rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-6 py-3 text-sm font-medium text-white hover:from-[#0E7490] hover:to-[#22D3EE] transition-all"
                    >
                        Sign in
                    </a>
                </div>
            </main>
        );
    }

    let hasAccess = false;

    // Check 1: User owns the deck
    if (deck.userId === session.user.id) {
        hasAccess = true;
    }

    // Check 2: User is a team member
    if (!hasAccess && deck.teamId) {
        const membership = await db.query.teamMembers.findFirst({
            where: and(
                eq(schema.teamMembers.teamId, deck.teamId),
                eq(schema.teamMembers.userId, session.user.id)
            ),
        });
        if (membership) hasAccess = true;
    }

    if (!hasAccess) {
        return (
            <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#0a1a1f] via-[#000000] to-[#000000]">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white">403</h1>
                    <p className="mt-4 text-xl text-[#A3A3A3]">You don&apos;t have access to this deck.</p>
                    <a
                        href="/dashboard"
                        className="mt-6 inline-block rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-6 py-3 text-sm font-medium text-white hover:from-[#0E7490] hover:to-[#22D3EE] transition-all"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </main>
        );
    }

    const isManual = deck.fileType === "manual";

    // For non-manual decks, check that extracted content exists in storage
    if (!isManual) {
        const storage = getStorage();
        const extractedKey = getStorageKey(id, "extracted");
        const exists = await storage.exists(extractedKey);
        if (!exists) {
            notFound();
        }
    }

    return (
        <main className="min-h-[calc(100vh-73px)] px-6 py-12 bg-gradient-to-b from-[#0a1a1f] via-[#000000] to-[#000000]">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                    {isManual ? deck.title : "Your Study Materials"}
                </h1>
                <p className="mt-3 text-lg text-[#A3A3A3]">
                    {isManual
                        ? "Add your notes and study materials below."
                        : "Choose a study mode to get started."}
                </p>

                <GenerateButtons deckId={id} isManual={isManual} />
            </div>
        </main>
    );
}
