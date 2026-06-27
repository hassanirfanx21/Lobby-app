import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ experienceId: string; userId: string }>;
}) {
  const { experienceId, userId: viewedUserId } = await params;
  const { userId: viewerUserId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: viewerUserId });
  
  if (!access.has_access) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Access denied</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", viewedUserId)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Profile not found</p>
      </div>
    );
  }

  if (viewerUserId !== viewedUserId) {
    const viewerUser = await whopsdk.users.retrieve(viewerUserId);
    await supabase.from("profile_views").insert({
      experience_id: experienceId,
      viewer_user_id: viewerUserId,
      viewer_name: viewerUser.name ?? viewerUser.username,
      viewed_user_id: viewedUserId,
    });
  }

  const isOpenToChatNow =
    profile.open_to_chat &&
    profile.open_to_chat_until &&
    new Date(profile.open_to_chat_until).getTime() > Date.now();

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--surface-base)" }}>
      <div className="max-w-xl mx-auto">
        <Link
          href={`/experiences/${experienceId}`}
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>←</span> Back to directory
        </Link>
        
        <div
          className="rounded-[24px] border card-shadow p-8 flex flex-col items-center text-center"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* Avatar */}
          <div className="relative mb-5">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold ${isOpenToChatNow ? 'avatar-ring avatar-ring--open' : ''}`}
              style={{
                background: "var(--surface-sunken)",
                color: "var(--text-tertiary)",
              }}
            >
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.name?.charAt(0)?.toUpperCase() ?? "?"
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap justify-center">
            {isOpenToChatNow && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded"
                style={{ background: "var(--status-open)", color: "#fff" }}
              >
                CHATTING
              </span>
            )}
            {profile.is_verified && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded"
                style={{ background: "var(--status-open)", color: "#fff" }}
              >
                ✓ VERIFIED
              </span>
            )}
          </div>

          {/* Name & Status */}
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}
          >
            {profile.name}
          </h1>
          
          {profile.status_line && (
            <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
              {profile.status_line}
            </p>
          )}

          {/* Bio */}
          {profile.bio ? (
            <div
              className="text-[15px] leading-relaxed mb-8 max-w-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {profile.bio}
            </div>
          ) : (
            <div className="mb-8" /> /* Spacing if no bio */
          )}

          {/* Tags */}
          {((profile.tags && profile.tags.length > 0) || (profile.coordination_tags && profile.coordination_tags.length > 0)) && (
            <div className="w-full pt-6 border-t flex flex-col items-center gap-3 mb-8" style={{ borderColor: "var(--border-subtle)" }}>
              {profile.tags && profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {profile.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        background: "var(--surface-sunken)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {profile.coordination_tags && profile.coordination_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {profile.coordination_tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: "var(--status-open)", color: "#fff", opacity: 0.9 }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action */}
          {viewerUserId !== viewedUserId && profile.allow_messages && profile.username ? (
            <a
              href={`https://whop.com/@${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs text-center text-sm font-semibold py-3.5 rounded-[16px] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Send Message
            </a>
          ) : viewerUserId !== viewedUserId ? (
            <div
              className="w-full max-w-xs text-center text-sm font-semibold py-3.5 rounded-[16px] border opacity-50"
              style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
            >
              Messages Disabled
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
