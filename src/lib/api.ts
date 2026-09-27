import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { HousingType, Intent, Listing, Neighborhood, Student } from "./data";
import type { Me } from "./store";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type SwipeRow = Database["public"]["Tables"]["swipes"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

function asRecord(value: Json | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function asPrompts(value: Json | null): { prompt: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const prompt = item["prompt"];
    const answer = item["answer"];
    if (typeof prompt !== "string") return [];
    return [{ prompt, answer: typeof answer === "string" ? answer : "" }];
  });
}

function relativeActive(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "online during lecture";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 5) return "online during lecture";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function profileToStudent(row: ProfileRow): Student {
  const socials = asRecord(row.socials);
  const spotify = asRecord(row.spotify);
  const prompts = asPrompts(row.prompts);
  return {
    id: row.user_id,
    name: row.name || "Gopher",
    pronouns: "",
    age: row.age ?? 18,
    gender: "",
    year: (row.year as Student["year"]) || "Freshman",
    classOf: "",
    major: row.major,
    hometown: row.home_state,
    housing: (row.housing_type as HousingType) || "Apartment",
    neighborhoods: row.locations as Neighborhood[],
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    moveIn: row.move_in,
    parking: (row.parking as Student["parking"]) || "No car",
    cleanliness: "Pretty tidy",
    sleep: "Somewhere between",
    intent: (row.intent as Intent) || "Just a roommate",
    hasRoommates: row.existing_roommates > 0,
    lookingForSubleaser: row.looking_for_subleaser || row.housing_type === "Subletting my place",
    verified: true,
    lastActive: relativeActive(row.last_active),
    socials: {
      instagram: socials["instagram"],
      snapchat: socials["snapchat"],
      tiktok: socials["tiktok"],
      linkedin: socials["linkedin"],
    },
    spotify: {
      track: spotify["track"] || "A song they care about",
      artist: spotify["artist"] || "Spotify",
    },
    prompts,
    opener: prompts[0]?.answer || "Ski-U-Mah! Let's connect soon",
  };
}

export function profileToMe(row: ProfileRow): Me {
  const socials = asRecord(row.socials);
  const spotify = asRecord(row.spotify);
  const center = Array.isArray(row.map_center)
    ? (row.map_center.filter((n): n is number => typeof n === "number") as number[])
    : [];
  return {
    email: row.email,
    firstName: row.name,
    preferredName: row.name,
    age: row.age != null ? String(row.age) : "",
    year: row.year,
    major: row.major,
    housing: row.housing_type,
    neighborhoods: row.locations,
    budget: `$${row.budget_min}–$${row.budget_max}`,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    dorms: row.dorms,
    address: row.address,
    mapCenter: [center[0] ?? 44.9765, center[1] ?? -93.2352],
    radiusMi: Number(row.radius_mi) || 1,
    roommates: row.existing_roommates,
    homeState: row.home_state,
    spotifyTrack: spotify["url"] || "",
    moveIn: row.move_in,
    parking: row.parking,
    household: "",
    intent: row.intent,
    prompts: asPrompts(row.prompts),
    socials,
    spotifyConnected: spotify["connected"] === "true" || Boolean(spotify["url"] || spotify["track"]),
  };
}

export function meToProfile(userId: string, email: string, me: Me, published: boolean): Database["public"]["Tables"]["profiles"]["Insert"] {
  const age = Number.parseInt(me.age, 10);
  return {
    user_id: userId,
    email,
    name: me.firstName || me.preferredName,
    age: Number.isFinite(age) ? age : null,
    year: me.year,
    major: me.major,
    housing_type: me.housing,
    locations: me.neighborhoods,
    budget_min: me.budgetMin,
    budget_max: me.budgetMax,
    move_in: me.moveIn,
    move_out: "",
    parking: me.parking,
    existing_roommates: me.roommates,
    intent: me.intent,
    socials: me.socials,
    spotify: {
      url: me.spotifyTrack,
      track: me.spotifyTrack,
      artist: "",
      connected: me.spotifyConnected ? "true" : "false",
    },
    photos: [],
    prompts: me.prompts,
    last_active: new Date().toISOString(),
    published,
    home_state: me.homeState,
    address: me.address,
    map_center: me.mapCenter,
    radius_mi: me.radiusMi,
    dorms: me.dorms,
    looking_for_subleaser: me.housing === "Subletting my place",
  };
}

export function listingFromRow(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    posterId: row.poster_id,
    pocket: row.pocket,
    rent: row.rent,
    utilities: row.utilities,
    moveIn: row.move_in,
    moveOut: row.move_out,
    parking: row.parking,
    existing: row.existing,
    note: row.note,
  };
}

export async function fetchOwnProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertOwnProfile(payload: Database["public"]["Tables"]["profiles"]["Insert"]) {
  const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function fetchDiscoverProfiles(userId: string) {
  const [{ data: profiles, error: pErr }, { data: swipes, error: sErr }] = await Promise.all([
    supabase.from("profiles").select("*").eq("published", true).neq("user_id", userId),
    supabase.from("swipes").select("*").eq("swiper_id", userId),
  ]);
  if (pErr) throw pErr;
  if (sErr) throw sErr;
  const swiped = new Set((swipes ?? []).map((s) => s.swipee_id));
  return (profiles ?? []).filter((p) => !swiped.has(p.user_id));
}

export async function fetchMySwipes(userId: string) {
  const { data, error } = await supabase.from("swipes").select("*").eq("swiper_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function recordSwipe(swiperId: string, swipeeId: string, direction: "like" | "pass" | "block") {
  const { data, error } = await supabase
    .from("swipes")
    .upsert({ swiper_id: swiperId, swipee_id: swipeeId, direction }, { onConflict: "swiper_id,swipee_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSwipe(swiperId: string, swipeeId: string) {
  const { error } = await supabase.from("swipes").delete().eq("swiper_id", swiperId).eq("swipee_id", swipeeId);
  if (error) throw error;
}

export async function findReciprocalLike(swiperId: string, swipeeId: string) {
  const { data, error } = await supabase
    .from("swipes")
    .select("*")
    .eq("swiper_id", swipeeId)
    .eq("swipee_id", swiperId)
    .eq("direction", "like")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMatch(userId: string, otherId: string) {
  const user_a = userId < otherId ? userId : otherId;
  const user_b = userId < otherId ? otherId : userId;
  const { data, error } = await supabase
    .from("matches")
    .upsert({ user_a, user_b }, { onConflict: "user_a,user_b" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyMatches(userId: string) {
  const { data, error } = await supabase.from("matches").select("*").or(`user_a.eq.${userId},user_b.eq.${userId}`);
  if (error) throw error;
  return data ?? [];
}

export async function deleteMatch(matchId: string) {
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw error;
}

export async function fetchProfilesByUserIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("user_id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(matchId: string) {
  const { data, error } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(matchId: string, senderId: string, body: string) {
  const { data, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: senderId, body }).select("*").single();
  if (error) throw error;
  return data;
}

export async function fetchListings() {
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function otherUserId(match: MatchRow, me: string) {
  return match.user_a === me ? match.user_b : match.user_a;
}

