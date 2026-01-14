"use client";

import { useState } from "react";

export default function InviteLinkSection({
  inviteCode,
}: {
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/teams/join/${inviteCode}`
      : `/teams/join/${inviteCode}`;

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-xl border border-[#404040] bg-[#121212] p-6">
      <h2 className="text-lg font-semibold text-white mb-2">Invite Link</h2>
      <p className="text-sm text-[#A3A3A3] mb-4">
        Share this link with others to invite them to join the team.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          value={inviteUrl}
          readOnly
          className="w-full rounded-lg border-2 border-[#404040] bg-[#0A0A0A] px-3 py-2 text-sm text-white truncate"
        />
        <button
          onClick={copyToClipboard}
          className="w-full rounded-lg border-2 border-[#404040] py-2 text-sm text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
        >
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>
      </div>
    </section>
  );
}
