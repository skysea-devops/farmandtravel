# Farm & Travel — Backend

Toprakla Yeniden / Farm & Travel platformunun backend'i. **Hono lambdalith** + **Clean Architecture** + **Repository Pattern**, TypeScript/Node, PostgreSQL.

Bu dizin Sprint 1 dikey dilimini içerir: **onboarding → AI etiket çıkarımı → etiket onayı → profil oluştur/getir**.

## Mimari

```
src/
  app.ts            # Hono router + middleware + hata çevirici
  main.ts           # AWS Lambda handler (API Gateway HTTP API)
  local.ts          # Lokal geliştirme sunucusu
  shared/           # db (pg pool, migrate, seed), config, errors, http/auth
  modules/
    members/        # domain / application / infrastructure / interface
    tags/           # taksonomi + AI etiket çıkarımı
migrations/         # 0001_init.sql (members, taxonomy, member_tags) + seed_taxonomy.sql
test/               # vitest
```

Katman bağımlılığı hep içe doğru: `interface → application → domain`, `infrastructure` portları uygular. `domain` hiçbir framework/AWS bilmez.

## Çekirdek kararlar (kodda görünür)

- **Etiket eksenleri:** `seek` (arıyorum) / `offer` (sunuyorum) / `topic` / `situation`. Yön eksende; "gönüllü arıyorum" (`seek:volunteers`) ≠ "gönüllü olmak istiyorum" (`offer:volunteer-labor`). Çiftlik sahibi = `situation:farm-owner` (filtrelenebilir).
- **AI etiketleme:** serbest metin → aktif taksonomiye maplanır (yeni etiket uydurulmaz), kullanıcı onaylar. `AI_MODE=stub` (kural tabanlı, lokal) | `bedrock` (Claude Haiku).
- **Gizlilik projeksiyonu:** `MemberRepository` üç görünüm sunar — full (owner), public (bağlantı öncesi; **şehir dahil, tam adres hariç**), contact (yalnız accepted connection sonrası). Private sütunlar public sorguya hiç girmez.

## Lokal çalıştırma

```bash
cp .env.example .env
docker compose up -d            # PostgreSQL
npm install
npm run migrate                 # tabloları oluştur
npm run seed                    # taksonomiyi yükle
npm run dev                     # http://localhost:8787
```

Auth lokal: `AUTH_MODE=dev` → `x-dev-sub` header'ıyla kullanıcı taklidi (yoksa `DEV_FAKE_SUB`).

## Örnek akış (lokal)

```bash
# 1) onboarding taslağı
curl -X POST localhost:8787/onboarding/draft -H 'content-type: application/json' \
  -d '{"draft":{"situation":["has-idea"]}}'

# 2) AI etiket önerisi
curl -X POST localhost:8787/tags/infer -H 'content-type: application/json' \
  -d '{"freeText":"Permakültür çiftliğim var, gönüllü arıyorum","quickPicks":[]}'

# 3) onaylanan etiketleri yaz
curl -X POST localhost:8787/onboarding/tags/confirm -H 'content-type: application/json' \
  -d '{"tags":[{"axis":"situation","value":"farm-owner"},{"axis":"seek","value":"volunteers"}]}'

# 4) profil güncelle (foto+ad+ülke → profile_complete)
curl -X PUT localhost:8787/profile -H 'content-type: application/json' \
  -d '{"firstName":"Elif","country":"Türkiye","city":"İzmir","avatarKey":"avatars/x.jpg"}'

# 5) profilimi getir
curl localhost:8787/profile/me
```

## Test / tip kontrolü
```bash
npm test
npm run typecheck
```

## Sonraki sprintler
- Sprint 2: discovery (`/search`, `/dashboard`, eşleşme) + S3 presign.
- Sprint 3: connections (state machine) + gizlilik projeksiyonu uçları + messaging.
- Sprint 4: subscriptions + Lemon Squeezy webhook + gating.
- Sprint 5: notifications + SES + GDPR.

Prod deploy Sprint 0 (Terraform) tamamlanınca; `main.ts` Lambda'ya, `DATABASE_URL` RDS'e bağlanır.
