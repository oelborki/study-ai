import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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
    let hasAccess = false;

    // Check 1: User owns the deck
    if (session?.user?.id && deck.userId === session.user.id) {
        hasAccess = true;
    }

    // Check 2: User is a team member
    if (!hasAccess && session?.user?.id && deck.teamId) {
        const membership = await db.query.teamMembers.findFirst({
            where: and(
                eq(schema.teamMembers.teamId, deck.teamId),
                eq(schema.teamMembers.userId, session.user.id)
            ),
        });
        if (membership) hasAccess = true;
    }

    // Check 3: Deck has an active share link
    if (!hasAccess) {
        const activeShare = await db.query.deckShares.findFirst({
            where: and(
                eq(schema.deckShares.deckId, id),
                eq(schema.deckShares.isActive, true)
            ),
        });
        if (activeShare) hasAccess = true;
    }

    if (!hasAccess) {
        notFound();
    }

    const isManual = deck.fileType === "manual";

    // For non-manual decks, require the JSON file (extracted content)
    if (!isManual) {
        const deckPath = path.join(process.cwd(), "data", `${id}.json`);
        try {
            await fs.readFile(deckPath, "utf8");
        } catch {
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
