import { NotFound } from "../../../shared/errors/index.js";
import type { MemberFull } from "../domain/member.js";
import type { MemberRepository, ProfilePatch } from "../domain/MemberRepository.js";

export class GetMyProfile {
  constructor(private repo: MemberRepository) {}
  async execute(memberId: string): Promise<MemberFull> {
    const m = await this.repo.getFullById(memberId);
    if (!m) throw NotFound("Üye bulunamadı");
    return m;
  }
}

export class SaveOnboardingDraft {
  constructor(private repo: MemberRepository) {}
  async execute(memberId: string, draft: Record<string, unknown>): Promise<void> {
    await this.repo.saveDraft(memberId, draft);
  }
}

export class UpdateProfile {
  constructor(private repo: MemberRepository) {}
  async execute(memberId: string, patch: ProfilePatch): Promise<MemberFull> {
    return this.repo.updateProfile(memberId, patch);
  }
}
