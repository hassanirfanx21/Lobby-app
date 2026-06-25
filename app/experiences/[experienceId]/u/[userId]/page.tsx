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
  if (!access.has_access) return <div className="p-6">Access denied</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", viewedUserId)
    .maybeSingle();

  if (!profile) return <div className="p-6">Profile not found</div>;

  if (viewerUserId !== viewedUserId) {
    const viewerUser = await whopsdk.users.retrieve(viewerUserId);
    await supabase.from("profile_views").insert({
      experience_id: experienceId,
      viewer_user_id: viewerUserId,
      viewer_name: viewerUser.name ?? viewerUser.username,
      viewed_user_id: viewedUserId,
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href={`/experiences/${experienceId}`} className="text-sm text-neutral-500 mb-4 inline-block">
          ← Back to directory
        </Link>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-200" />
            )}
            <div>
              <p className="font-semibold text-lg text-neutral-900">{profile.name}</p>
              {profile.status_line && <p className="text-sm text-neutral-500">{profile.status_line}</p>}
            </div>
          </div>
          <p className="text-neutral-700 mb-4">{profile.bio}</p>
          {profile.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {profile.tags.map((t: string) => (
                <span key={t} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          {viewerUserId !== viewedUserId && profile.allow_messages && profile.username && (
            <a
              href={`https://whop.com/@${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition"
            >
              Message
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
