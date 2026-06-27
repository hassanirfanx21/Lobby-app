"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { DEFAULT_INTEREST_TAGS, DEFAULT_COORDINATION_TAGS } from "@/lib/default-tags";

export type TagOption = {
  id: string;
  experience_id: string;
  category: "interest" | "coordination";
  label: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

// Internal helper for admin auth
async function requireAdmin(experienceId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (access.access_level !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function getTagOptions(experienceId: string, category: "interest" | "coordination") {
  // 1. Fetch existing
  const { data: existing, error } = await supabase
    .from("tag_options")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("category", category)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  // 2. Seed defaults if completely empty (never seeded before)
  if (!existing || existing.length === 0) {
    const defaults = category === "interest" ? DEFAULT_INTEREST_TAGS : DEFAULT_COORDINATION_TAGS;
    const toInsert = defaults.map((label, idx) => ({
      experience_id: experienceId,
      category,
      label,
      sort_order: idx,
      is_active: true,
      is_default: true,
    }));

    const { data: seeded, error: seedError } = await supabase
      .from("tag_options")
      .insert(toInsert)
      .select("*")
      .order("sort_order", { ascending: true });

    if (seedError) throw new Error(seedError.message);
    return seeded as TagOption[];
  }

  return existing as TagOption[];
}

export async function addTagOption(experienceId: string, category: "interest" | "coordination", label: string) {
  await requireAdmin(experienceId);
  const cleanLabel = label.trim();
  if (!cleanLabel) return { error: "Tag cannot be empty" };

  const { data: existing } = await supabase
    .from("tag_options")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("category", category);
    
  if (existing && existing.length >= 30) {
    return { error: "Maximum of 30 tags allowed per category" };
  }

  // Use max sort_order
  const { data: maxOrderRow } = await supabase
    .from("tag_options")
    .select("sort_order")
    .eq("experience_id", experienceId)
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrderRow ? maxOrderRow.sort_order + 1 : 0;

  const { error } = await supabase.from("tag_options").insert({
    experience_id: experienceId,
    category,
    label: cleanLabel,
    sort_order: nextOrder,
    is_active: true,
    is_default: false,
  });

  if (error) {
    // Unique constraint violation
    if (error.code === "23505") return { error: "A tag with this name already exists" };
    return { error: error.message };
  }

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function renameTagOption(experienceId: string, tagId: string, oldLabel: string, newLabel: string, category: "interest" | "coordination") {
  await requireAdmin(experienceId);
  const cleanLabel = newLabel.trim();
  if (!cleanLabel) return { error: "Tag cannot be empty" };

  // 1. Update tag
  const { error: updateError } = await supabase
    .from("tag_options")
    .update({ label: cleanLabel })
    .eq("id", tagId)
    .eq("experience_id", experienceId);

  if (updateError) {
    if (updateError.code === "23505") return { error: "A tag with this name already exists" };
    return { error: updateError.message };
  }

  // 2. Cascade to profiles
  const column = category === "interest" ? "tags" : "coordination_tags";
  
  const { data: profilesToUpdate } = await supabase
    .from("profiles")
    .select(`id, ${column}`)
    .eq("experience_id", experienceId)
    .contains(column, [oldLabel]);

  if (profilesToUpdate && profilesToUpdate.length > 0) {
    for (const p of profilesToUpdate) {
      const arr = (p as any)[column] as string[];
      if (!arr) continue;
      const newArr = arr.map(t => t === oldLabel ? cleanLabel : t);
      await supabase.from("profiles").update({ [column]: newArr }).eq("id", p.id);
    }
  }

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function deactivateTagOption(experienceId: string, tagId: string, label: string, category: "interest" | "coordination") {
  await requireAdmin(experienceId);

  // 1. Deactivate
  const { error } = await supabase
    .from("tag_options")
    .update({ is_active: false })
    .eq("id", tagId)
    .eq("experience_id", experienceId);

  if (error) return { error: error.message };

  // 2. Strip from profiles
  const column = category === "interest" ? "tags" : "coordination_tags";
  const { data: profilesToUpdate } = await supabase
    .from("profiles")
    .select(`id, ${column}`)
    .eq("experience_id", experienceId)
    .contains(column, [label]);

  if (profilesToUpdate && profilesToUpdate.length > 0) {
    for (const p of profilesToUpdate) {
      const arr = (p as any)[column] as string[];
      if (!arr) continue;
      const newArr = arr.filter(t => t !== label);
      await supabase.from("profiles").update({ [column]: newArr }).eq("id", p.id);
    }
  }

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function reactivateTagOption(experienceId: string, tagId: string) {
  await requireAdmin(experienceId);
  const { error } = await supabase
    .from("tag_options")
    .update({ is_active: true })
    .eq("id", tagId)
    .eq("experience_id", experienceId);

  if (error) return { error: error.message };
  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function reorderTagOptions(experienceId: string, category: "interest" | "coordination", orderedIds: string[]) {
  await requireAdmin(experienceId);
  
  // Update sort_order for each ID sequentially
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("tag_options")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("experience_id", experienceId);
  }
  
  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}

export async function resetTagsToDefault(experienceId: string, category: "interest" | "coordination") {
  await requireAdmin(experienceId);
  
  // 1. Get all defaults
  const defaults = category === "interest" ? DEFAULT_INTEREST_TAGS : DEFAULT_COORDINATION_TAGS;
  
  // 2. Fetch all current tags
  const { data: allTags } = await supabase
    .from("tag_options")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("category", category);
    
  if (!allTags) return { error: "Failed to load tags" };

  // 3. For each existing tag:
  //    - If it's in defaults, reactivate and update sort_order.
  //    - If it's NOT in defaults, deactivate (and strip from profiles).
  //    - If a default is missing entirely, insert it.

  let sortOrder = 0;
  for (const defaultLabel of defaults) {
    const existing = allTags.find(t => t.label === defaultLabel);
    if (existing) {
      await supabase.from("tag_options").update({
        is_active: true,
        sort_order: sortOrder++
      }).eq("id", existing.id);
    } else {
      await supabase.from("tag_options").insert({
        experience_id: experienceId,
        category,
        label: defaultLabel,
        sort_order: sortOrder++,
        is_active: true,
        is_default: true,
      });
    }
  }

  // Deactivate non-defaults
  const column = category === "interest" ? "tags" : "coordination_tags";
  for (const tag of allTags) {
    if (!defaults.includes(tag.label) && tag.is_active) {
      await deactivateTagOption(experienceId, tag.id, tag.label, category);
    }
  }

  revalidatePath(`/experiences/${experienceId}`);
  return { success: true };
}
