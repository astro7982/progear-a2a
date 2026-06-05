# ProGear A2A — Okta for AI Agents Demo

The customer-facing demo for **Agent-to-Agent (A2A) identity chaining** with Okta for AI Agents. One Sarah Sales experience, four escalating scenes, anchored on Bala's tenant `bala-secures-ai.oktapreview.com`.

**Live demo:** https://progear-a2a.vercel.app
**Plan:** `~/.claude/plans/floating-wishing-dragon.md`

---

## What ships in Phase 1 (today)

- **Scene 1 — "Quick Check" (HI two-layer chain):** Sarah signs in via Okta OIDC against AS-A2A-Sales, types a stock question. The Sales agent token-exchanges her access token for an id-jag at the Org AS, then redeems it at AS-A2A-Inventory for an Inventory access token. The act chain at T3 carries `{Sales agent → Sarah}`. The Inventory MCP response is mocked at this stage.
- **Three-pane theater UI:** Sarah's chat (left), delegation tree (center), act chain stack (right), audit timeline pulling Bala tenant System Log (bottom). Framer Motion animations on tree growth + act chain pushes.
- **Live System Log audit feed:** the audit timeline is an SSE proxy of `app.oauth2.token.grant.id_jag` and `app.oauth2.as.token.grant.access_token` events from Bala's tenant.

## What's stubbed (next phases)

- Scene 2 (FGA HITL) — model + checks ready, UI gate not yet wired
- Scene 3 (NHI / 2am reorder) — needs `SERVICE_CLIENT_SECRET` from Bala
- Scene 4 (Without Okta) — fixture-driven, deferred
- ProGear MCP server — Scene 1 mocks the final response

---

## Architecture (one slide)

```
Vercel: Next.js 16 ──── id-jag chain ───► Okta tenant: bala-secures-ai.oktapreview.com
   │                                            (Service Client, WebApp, 2 ai-agents,
   │                                            3 Custom AS, delegation-links, managed conns)
   │
   └─ Auth0 FGA cloud ◄── Check / Write ─── Server actions (Scene 2 FGA gate)
```

---

## Repos & infrastructure

| Surface | Location |
|---|---|
| This repo | https://github.com/astro7982/progear-a2a |
| Vercel project | `astroprojects/progear-a2a` (https://vercel.com/astroprojects/progear-a2a) |
| Okta tenant | `bala-secures-ai.oktapreview.com` |
| FGA store | `01KTCWNRPZAH5D1MKDZGZYKDEA` (model `01KTCXNEYRWQSFARYFHAZPSTGH`) |

## Identities provisioned in Bala's tenant

| Subject | ID | Role |
|---|---|---|
| Sarah Sales | `00uzns5sdkbmLgQkC1d7` | sales tier user (login `sarah.sales@progear.demo`) |
| Bala CFO | `00uznsd64rgMgEzTE1d7` | finance tier approver |
| ProGear A2A Demo Web App | `0oazns4s2moIlRzoG1d7` | OIDC web app for HI flow |

---

## Local development

```bash
# .env.local already populated (gitignored). Ensure your Okta admin token is current:
#   /Users/johnathan.campos/Desktop/OktaBala.txt

pnpm install
pnpm dev               # http://localhost:3000

# Smoke tests
pnpm tsx scripts/verify.ts          # JWK signing
pnpm tsx scripts/test-fga-flow.ts   # FGA gate end-to-end against Auth0 cloud
```

## End-to-end manual test (Scene 1)

1. Open https://progear-a2a.vercel.app
2. Click **Login as Sarah** → redirects to Bala's Okta tenant
3. Sign in: `sarah.sales@progear.demo` / `ProgearDemo2026!`
4. Land back on the demo, signed in
5. Click **Run Scene 1**
6. Expect:
   - Delegation tree fills bottom-down: Sarah → Sales agent → Inventory agent → InventoryMCP
   - Act chain stack pushes 2 cards (Sales agent, Sarah)
   - Audit timeline gains 2 new events from Bala's tenant within ~2-3 seconds (id-jag + access token grants)
   - Chat shows the agent dialogue concluding with the stock answer

---

## Critical files

| File | Purpose |
|---|---|
| `src/lib/tokens/jwt-utils.ts` | RS256 client_assertion signing (lifted from Bala's TokenInspector) |
| `src/lib/tokens/token-steps.ts` | T1..T5 chain executors against Bala's tenant |
| `src/lib/tokens/decode.ts` | client-safe JWT decode + act chain extraction |
| `src/lib/scenes/scene-1.ts` | Scene 1 script + agent dialogue + SSE event generation |
| `src/lib/okta/auth-config.ts` | NextAuth Okta provider config for HI flow |
| `src/lib/okta/system-log.ts` | A2A System Log query + act chain capture |
| `src/lib/fga/client.ts` | Auth0 FGA SDK wrapper |
| `src/lib/fga/checks.ts` | `canFinalizeQuote` gate logic for Scene 2 |
| `src/components/DemoStage.tsx` | Top-level client component orchestrating SSE + UI state |
| `src/app/api/scene/[id]/run/route.ts` | SSE endpoint executing the chain |
| `src/app/api/audit/stream/route.ts` | SSE proxy of Okta System Log |
