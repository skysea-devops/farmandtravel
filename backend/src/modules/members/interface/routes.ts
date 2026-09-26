import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser } from "../../../shared/http/auth.js";
import { MemberRepositoryPg } from "../infrastructure/MemberRepositoryPg.js";
import { GetMyProfile, SaveOnboardingDraft, UpdateProfile } from "../application/profile.js";

const repo = new MemberRepositoryPg();
const getMyProfile = new GetMyProfile(repo);
const saveDraft = new SaveOnboardingDraft(repo);
const updateProfile = new UpdateProfile(repo);

export const membersRoutes = new Hono();

// Onboarding anketi taslağını kaydet (O1)
const draftSchema = z.object({ draft: z.record(z.unknown()) });
membersRoutes.post("/onboarding/draft", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { draft } = draftSchema.parse(await c.req.json());
  await saveDraft.execute(memberId, draft);
  return c.json({ ok: true });
});

// Kendi profilim (owner projection)
membersRoutes.get("/profile/me", auth, async (c) => {
  const { memberId } = currentUser(c);
  const me = await getMyProfile.execute(memberId);
  return c.json(me);
});

// Profil oluştur/güncelle (O3)
const profileSchema = z.object({
  firstName: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  city: z.string().optional(),
  languages: z.array(z.string()).optional(),
  headline: z.string().optional(),
  bio: z.string().max(2000).optional(),
  avatarKey: z.string().optional(),
  lastName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  socials: z.record(z.unknown()).optional(),
  employer: z.string().optional(),
  addressExact: z.string().optional(),
  profile: z.record(z.unknown()).optional(),
});
membersRoutes.put("/profile", auth, async (c) => {
  const { memberId } = currentUser(c);
  const patch = profileSchema.parse(await c.req.json());
  const updated = await updateProfile.execute(memberId, patch);
  return c.json(updated);
});
