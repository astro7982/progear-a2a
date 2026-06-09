# ProGear A2A Demo — Complete Handoff Document

> **Purpose:** Everything a new session needs to pick up where this one left off. Architecture, credentials, what works, what's next, known issues, and how to verify.

---

## 1. What This Is

A **customer-facing demo** for **Okta for AI Agents Agent-to-Agent (A2A) identity chaining**. It's a real internal operations console for "ProGear" (a sporting goods company). Sarah Sales uses an AI assistant to check stock, place orders, and manage inventory. Behind the scenes, multiple AI agents collaborate — Sales Agent calls Inventory Agent calls an MCP server — and Okta secures every hop with cryptographic identity delegation.

**Live URL:** https://progear-a2a.vercel.app
**Engineer view:** https://progear-a2a.vercel.app/engineer
**Pop-out chat:** https://progear-a2a.vercel.app/chat
**Mike's approver pane:** https://progear-a2a.vercel.app/approver/mike

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Vercel: Next.js 16  (progear-a2a.vercel.app)                    │
│                                                                  │
│  Routes:                                                         │
│    / — Login page (unauthenticated) OR AppShell (authenticated)  │
│    /chat — Standalone pop-out AI chat                            │
│    /engineer — Technical three-pane view (DelegationTree, etc.)  │
│    /approver/mike — Manager approval pane                        │
│    /api/auth/[...nextauth] — NextAuth v5 + Okta OIDC            │
│    /api/chat — LLM chat + real A2A chain + FGA gate              │
│    /api/approval/{pending,approve} — FGA approval queue          │
│    /api/scene/[id]/run — SSE chain runner (Phase 1 legacy)       │
│    /api/audit/stream — System Log SSE proxy                      │
│                                                                  │
│  Token chain: T1→T2→T3→T4→T5→MCP (5 hops, 3 token types)       │
│  LLM: Anthropic Claude (claude-sonnet-4-20250514)                │
│  FGA: Auth0 FGA cloud (order-based quantity threshold)           │
└────────┬──────────────────────────────┬──────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐       ┌──────────────────────┐
│ Okta tenant:         │       │ Auth0 FGA cloud      │
│ bala-secures-ai      │       │ Store: progear-a2a   │
│ .oktapreview.com     │       │ Model: order-based   │
└──────────┬───────────┘       └──────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Render: ProGear MCP Server       │
│ progear-mcp-a2a.onrender.com     │
│ (TypeScript + Fastify + JWT val) │
└──────────────────────────────────┘
```

---

## 3. Repositories

| Repo | Purpose | URL |
|---|---|---|
| progear-a2a | Next.js frontend + API routes | https://github.com/astro7982/progear-a2a |
| progear-mcp-a2a | MCP server (Fastify, Render) | https://github.com/astro7982/progear-mcp-a2a |

---

## 4. Infrastructure

| Service | Platform | URL | Notes |
|---|---|---|---|
| Frontend | Vercel | progear-a2a.vercel.app | Scope: astroprojects |
| MCP Server | Render | progear-mcp-a2a.onrender.com | Free tier (30s cold start) |
| Identity | Okta | bala-secures-ai.oktapreview.com | Bala's demo tenant |
| Authorization | Auth0 FGA | api.us1.fga.dev | Store 01KTCWNRPZAH5D1MKDZGZYKDEA |

---

## 5. Okta Tenant Configuration (bala-secures-ai.oktapreview.com)

### Users

| Login | User ID | Role | Password |
|---|---|---|---|
| sarah.sales@progear.demo | 00uzo2py99aTcXKAG1d7 | Sales rep | ProgearDemo2026! |
| mike.manager@progear.demo | 00uzs6z91boWF1GQq1d7 | Manager (approver) | ProgearDemo2026! |
| bala.cfo@progear.demo | 00uznsd64rgMgEzTE1d7 | CFO (Phase 2 stretch) | ProgearDemo2026! |

### Groups

| Group | ID | Members |
|---|---|---|
| progear-sales | 00gznsaazsc0couLK1d7 | Sarah |
| progear-finance | 00gzns40tlgBjA36R1d7 | Bala |
| progear-managers | 00gzs6vwsioLsp40Q1d7 | Mike |

### OIDC Web App

| Field | Value |
|---|---|
| App ID / Client ID | 0oazns4s2moIlRzoG1d7 |
| Label | ProGear A2A Demo Web App |
| Grant types | authorization_code, token-exchange |
| Redirect URIs | http://localhost:3000/api/auth/callback/okta, https://progear-a2a.vercel.app/api/auth/callback/okta |
| Auth policy | rstznwblnj5uHdcqV1d7 (1FA password, Allow All) |

### Authorization Servers

| Name | AS ID | Audience |
|---|---|---|
| AS-A2A-Sales | auszakltaaxuEH0s71d7 | https://progear.com/sales-resource |
| AS-A2A-Inventory | auszalb8rzrFTrhPa1d7 | https://progear.com/inventory-resource |
| AS-A2A-InventoryMCP | auszam0ov23cgv2Kd1d7 | https://progear.com/inventoryMCP-resource |

### AI Agents (Workload Principals)

| Agent | WLP ID | Resource URL | JWK kid |
|---|---|---|---|
| Sales Agent | wlpzamsn8ruzX9RiH1d7 | https://progear.com/sales | a7531e69eadb5b5ab26488c49aa183e7 |
| Inventory Agent | wlpzantdeiOQGRrpF1d7 | https://progear.com/inventory | 3804ec3c470466c9f49f34f5c448418d |

### Managed Connections

| From | To | Type | Connection ID |
|---|---|---|---|
| Sales Agent | Inventory Agent | IDENTITY_ASSERTION_A2A_SERVER | mcnzao4w0f1ObJdru1d7 |
| Inventory Agent | InventoryMCP | IDENTITY_ASSERTION_CUSTOM_AS | mcnzaojcodlnmNEKu1d7 |

### Delegation Links (into Sales Agent)

| From | Token Type | Link ID |
|---|---|---|
| Service Client (0oazakcme19yZ44th1d7) | ACCESS_TOKEN | dlkzankljcPMHiwac1d7 |
| Original WebApp (0oazektoz797Aaq0L1d7) | ID_TOKEN | dlkzekqkm3CPa7LIu1d7 |
| Original WebApp | ACCESS_TOKEN | dlkzfhq9i60BXpHjE1d7 |
| Our new WebApp (0oazns4s2moIlRzoG1d7) | ACCESS_TOKEN | dlkzo3uwyn9gjRhQE1d7 |

### Token Chain Flow

```
T1: authorization_code @ AS-A2A-Sales → Sarah's access_token (aud=progear.com/sales)
T2: token-exchange @ Org AS → id-jag (aud=Inventory AS, act={Sales→WebApp})
T3: jwt-bearer @ AS-A2A-Inventory → access_token (aud=progear.com/inventory-resource)
T4: token-exchange @ Org AS → id-jag (aud=InventoryMCP AS, act={Inventory→Sales→WebApp})
T5: jwt-bearer @ AS-A2A-InventoryMCP → access_token (aud=progear.com/inventoryMCP-resource)
```

---

## 6. Auth0 FGA Configuration

| Field | Value |
|---|---|
| API URL | https://api.us1.fga.dev |
| Store ID | 01KTCWNRPZAH5D1MKDZGZYKDEA |
| Model ID | 01KTMWXMERDDFTH0NPV43NYQAE |
| Client ID | KitALpdUZtXh3XoGKCTzbaiZ6Tbs1oSR |

### FGA Model (order-based)

```
type user
type group
  relations: member [user]
type order
  relations:
    creator [user]
    manager_approver [user, group#member]
```

### Decision Logic (in code, not FGA relations)

- qty ≤ 50: Check `creator` → allowed (Sarah auto-approves small orders)
- qty > 50: Check `manager_approver` → blocked until Mike writes tuple
- After Mike approves: `grantManagerApproval(mike, orderId)` writes tuple → re-check passes

### Seeded Tuples

- `user:sarah.sales@progear.demo, member, group:progear-sales`
- `user:mike.manager@progear.demo, member, group:progear-managers`

---

## 7. Key Files

### Token Chain Logic
- `src/lib/tokens/jwt-utils.ts` — RS256 client_assertion signing (from Bala's TokenInspector)
- `src/lib/tokens/token-steps.ts` — executeStep1NHI, executeStep2..5
- `src/lib/tokens/decode.ts` — JWT decode + extractActChain

### Auth
- `src/lib/okta/auth-config.ts` — NextAuth v5 + customFetch hook for RFC 8707 resource
- `src/lib/okta/auth.ts` — NextAuth handlers export
- `src/lib/okta/system-log.ts` — System Log query helpers

### FGA
- `src/lib/fga/client.ts` — Auth0 FGA SDK wrapper
- `src/lib/fga/order-checks.ts` — canPlaceOrder, markOrderCreator, grantManagerApproval
- `src/lib/fga/approval-queue.ts` — In-memory pending approval queue

### AI / LLM
- `src/lib/ai/chat.ts` — Claude system prompt + generateResponse (with live inventory context)
- `src/lib/ai/order-intent.ts` — Parse order quantity from free-text messages

### MCP Client
- `src/lib/mcp/client.ts` — Typed HTTP client for the Render MCP server

### UI Components
- `src/components/app/AppShell.tsx` — Main app shell (sidebar, nav, dashboard pages, AI panel)
- `src/components/app/AIChatPanel.tsx` — Tabbed AI panel (Activity + Engineering), provenance tree, governance log
- `src/components/app/ProvenanceTree.tsx` — Identity provenance visualization
- `src/components/app/GovernanceLog.tsx` — Terminal-style audit events
- `src/components/app/EngineeringPanel.tsx` — JWT inspector + System Log

### API Routes
- `src/app/api/chat/route.ts` — Main chat endpoint (LLM + chain + FGA + MCP)
- `src/app/api/approval/pending/route.ts` — List pending approvals
- `src/app/api/approval/approve/route.ts` — Approve an order (writes FGA tuple)
- `src/app/api/scene/[id]/run/route.ts` — SSE chain runner (legacy, used by /engineer)
- `src/app/api/audit/stream/route.ts` — System Log SSE proxy

---

## 8. Environment Variables

All in `.env.local` (gitignored). Also set in Vercel production env.

```bash
OKTA_ORG_URL=https://bala-secures-ai.oktapreview.com
OKTA_DOMAIN=bala-secures-ai.oktapreview.com
OKTA_ORG_ID=00ow25t4lmRe0O2oI1d7
OKTA_ADMIN_TOKEN=<SSWS token from OktaBala.txt>

WEBAPP_CLIENT_ID=0oazns4s2moIlRzoG1d7
WEBAPP_CLIENT_SECRET=<64 char secret>
WEBAPP_AUTH_SERVER_ID=auszakltaaxuEH0s71d7

SERVICE_CLIENT_ID=0oazakcme19yZ44th1d7

SALES_AS_ID=auszakltaaxuEH0s71d7
INVENTORY_AS_ID=auszalb8rzrFTrhPa1d7
INVENTORY_MCP_AS_ID=auszam0ov23cgv2Kd1d7

SALES_AGENT_ID=wlpzamsn8ruzX9RiH1d7
INVENTORY_AGENT_ID=wlpzantdeiOQGRrpF1d7
SALES_AGENT_PRIVATE_KEY_JWK=<RSA JWK JSON, kid a7531e69...>
INVENTORY_AGENT_PRIVATE_KEY_JWK=<RSA JWK JSON, kid 3804ec3c...>

FGA_API_URL=https://api.us1.fga.dev
FGA_STORE_ID=01KTCWNRPZAH5D1MKDZGZYKDEA
FGA_MODEL_ID=01KTMWXMERDDFTH0NPV43NYQAE
FGA_CLIENT_ID=KitALpdUZtXh3XoGKCTzbaiZ6Tbs1oSR
FGA_CLIENT_SECRET=<64 char secret>
FGA_API_TOKEN_ISSUER=auth.fga.dev
FGA_API_AUDIENCE=https://api.us1.fga.dev/

ANTHROPIC_API_KEY=sk-ant-api03-...

MCP_BASE_URL=https://progear-mcp-a2a.onrender.com

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<base64 generated>

DEMO_SARAH_LOGIN=sarah.sales@progear.demo
DEMO_SARAH_PASSWORD=ProgearDemo2026!
DEMO_BALA_LOGIN=bala.cfo@progear.demo
DEMO_BALA_PASSWORD=ProgearDemo2026!
```

---

## 9. What Works (QC Verified)

| Scenario | Status | Evidence |
|---|---|---|
| Sarah OIDC sign-in | ✅ PASS | Full auth code + PKCE flow |
| A2A chain fires on every chat message | ✅ PASS | T1→T2→T3 with real id-jag emission |
| LLM responds with real MCP data | ✅ PASS | Claude answers with live stock numbers |
| FGA blocks orders > 50 units | ✅ PASS | pendingApproval returned to frontend |
| Mike approves via /approver/mike | ✅ PASS | FGA tuple writes, order unblocks |
| Small orders auto-approve | ✅ PASS | No FGA block on ≤50 |
| MCP server validates JWT | ✅ PASS | 401 without token, 200 with valid T5 |
| Okta System Log proves real chain | ✅ PASS | 4 id-jag + 4 access_token events |
| Agent is first-class identity | ✅ PASS | WLP active, own JWK, A2A connection |
| All routes (/chat, /engineer, /approver/mike) | ✅ PASS | HTTP 200 |
| Pop-out chat window | ✅ PASS | Opens standalone, docks back |
| Nav buttons work with real pages | ✅ PASS | Orders, Inventory, Customers, Activity Log, Settings |

---

## 10. Known Issues / Limitations

1. **MCP cold start:** Render free tier sleeps after 15 min inactivity. First chat after idle takes ~30s. Workaround: hit `/health` to wake it before demo.

2. **FGA eventual consistency:** Auth0 FGA has slight eventual consistency window. We use `ConsistencyPreference.HigherConsistency` on all reads. Occasionally a write + immediate re-read might miss — the approval polling handles this.

3. **SERVICE_CLIENT_SECRET not captured:** We never got the NHI service client's secret from Bala. Scene 3 (2am reorder / NHI) is not wired. Would need Bala to share or rotate.

4. **T4+T5 chain sometimes timeout on Vercel:** The full 5-hop chain takes 2-4 seconds. Vercel serverless has 10s timeout. Usually fine, but if MCP is cold-starting simultaneously it can exceed. Falls back to T3-only chain + hardcoded stock data.

5. **NextAuth v5 + RFC 8707:** The `customFetch` hook on the provider is critical. Without it, Sarah's T1 has wrong audience and the chain fails with `invalid_subject_token`. See `src/lib/okta/auth-config.ts`. oauth4webapi v3 passes `init.body` as `URLSearchParams` (not string). Must mutate in place.

6. **OIE password authenticator enrollment:** API-created users don't get OIE Password authenticator enrolled. Sarah was created via admin UI to work around this. If recreating users, use the admin UI (not POST /api/v1/users).

7. **AS-A2A-Sales scope rule must be wildcard `[*]`:** NextAuth requests `openid profile email agent.invoke`. If the AS rule only allows specific scopes, the authorize request fails with `error=access_denied`.

---

## 11. The Demo Story (3 Beats)

**Beat 1 — "50 basketballs, no problem"**
Sarah asks: "Order 50 basketballs for Westside High"
→ Chain fires (green shields animate in provenance tree)
→ FGA auto-approves (≤50 threshold)
→ LLM confirms: "Order placed!"
→ Point: "Fast. Seamless. Governed. Sarah doesn't notice identity is being verified at every hop."

**Beat 2 — "Make it 500"**
Sarah asks: "Order 500 basketballs for State University"
→ Chain fires but STALLS at the FGA gate (amber shield)
→ Chat says: "Manager approval required. Mike has been notified."
→ Open /approver/mike in second tab → Mike sees pending → Approves
→ Tree resumes green → Order confirmed
→ Point: "The agent CAN'T go rogue. The platform decides what needs a human."

**Beat 3 — "Prove it"**
Switch to Engineering tab or Activity Log page
→ Show Okta System Log events with real id-jag emissions
→ Show the act chain: `{ai_agent → web_app}` signed by Okta
→ Point: "Every action is audit-traceable. If Sarah leaves tomorrow, every order she triggered is still attributable. This is NOT theater — the System Log is cryptographic proof."

---

## 12. What's NOT Built Yet (Phase 2+)

| Feature | Status | What's needed |
|---|---|---|
| Scene 3: NHI / 2am reorder | Not started | SERVICE_CLIENT_SECRET from Bala |
| Scene 4: "Without Okta" comparison | Not started | Fixture-based replay mode |
| Real OIG access requests | Not started | OIG request types in Bala's tenant (admin UI config) |
| Cross-tenant XAA (Scene 5) | Not started | Second Okta tenant for partner |
| T5 → real MCP tool calls for orders | Partially | check_stock works; create_order/order_from_distributor wired but untested end-to-end |
| Revoke-Sarah kill switch demo | Not started | Suspend user → retry → show failure |
| Curated/live toggle | Not started | Fixture capture + replay mode |

---

## 13. How to Develop Locally

```bash
cd /Users/johnathan.campos/code/progear-a2a
pnpm install
pnpm dev   # http://localhost:3000

# Smoke tests
pnpm tsx scripts/verify.ts              # JWK signing
pnpm tsx scripts/test-fga-order-flow.ts # FGA gate
pnpm tsx scripts/test-hi-chain.ts       # Full HI chain (T1→T2→T3)
pnpm tsx scripts/diagnose-hi.ts         # Three-way audience comparison
```

---

## 14. How to Deploy

```bash
cd /Users/johnathan.campos/code/progear-a2a
pnpm build                    # verify
git add -A && git commit -m "..."
git push origin main
vercel deploy --prod --force  # production
```

---

## 15. Critical Gotchas (Lessons Learned)

1. **NextAuth v5 `customFetch`:** Must be set on the PROVIDER OBJECT (spread `Okta(...)` then add `[customFetch]`). Okta helper stashes everything in `.options`, never on the provider. oauth4webapi v3 passes body as URLSearchParams, not string.

2. **OIE password enrollment:** POST /api/v1/users with credentials.password does NOT enroll the Password authenticator in OIE. User must be created via admin UI or go through interactive flow once.

3. **AS policy scope rule:** Must use `["*"]` wildcard. NextAuth requests `openid profile email agent.invoke` — any unlisted scope causes `error=access_denied`.

4. **MFA enrollment policy + password policy interaction:** Password policy's `selfServicePasswordReset.requirement.primary.methods` forces authenticator enrollment even if MFA enrollment policy says NOT_ALLOWED. Fix: scoped password policy for demo users with self-service reset DISABLED.

5. **Delegation link creation:** When creating via API, Okta normalizes `apps:oidc` to `apps:oidc_client` in the clientOrn. The `to.authorizationServerOrn` field auto-populates based on the target agent's linked AS.

6. **FGA_MODEL_ID in Vercel:** When you update the FGA model (new model version), you MUST also update the Vercel env var. Old model IDs cause silent FGA failures (caught by try/catch, no pendingApproval returned).

7. **Token audience binding (RFC 8707):** Without `resource=https://progear.com/sales` at the token endpoint, Okta issues T1 with `aud=progear.com/sales-resource` (the AS audience) instead of `progear.com/sales` (the agent resourceUrl). Org AS rejects these as invalid_subject_token.

---

## 16. Useful Scripts

| Script | Purpose |
|---|---|
| `scripts/verify.ts` | Smoke-test JWK signing for both agents |
| `scripts/test-hi-chain.ts` | Full HI chain (legacy authn → OIDC → T2 → T3) |
| `scripts/test-fga-order-flow.ts` | FGA gate: 10 auto, 500 blocked, Mike approves |
| `scripts/diagnose-hi.ts` | Three-way comparison: resource at both/authorize-only/neither |
| `scripts/setup-fga.ts` | Write original FGA model + seed tuples |
| `scripts/update-fga-model.ts` | Write order-based FGA model + seed Mike |
| `scripts/test-live-nextauth.ts` | Drive full NextAuth OIDC flow via curl and decode T1 |

---

## 17. Credential Locations

| Credential | Location |
|---|---|
| Okta admin tokens (both tenants) | /Users/johnathan.campos/Desktop/OktaBala.txt |
| All env vars | /Users/johnathan.campos/code/progear-a2a/.env.local |
| Agent private JWKs | In .env.local (SALES_AGENT_PRIVATE_KEY_JWK, INVENTORY_AGENT_PRIVATE_KEY_JWK) |
| FGA client secret | In .env.local (FGA_CLIENT_SECRET) |
| Anthropic API key | In .env.local (ANTHROPIC_API_KEY) |
| OIDC client secret | In .env.local (WEBAPP_CLIENT_SECRET) |

---

## 18. Memory Files (for Claude sessions)

Relevant memories stored at `/Users/johnathan.campos/.claude/projects/-Users-johnathan-campos/memory/`:

- `project_progear_a2a_demo.md` — Project overview, key IDs, phase status
- `reference_okta_auth_debugging.md` — curl+sessionToken trick for OIDC debugging
- `reference_oie_password_authenticator_enrollment.md` — API-created user gotcha
- `reference_oie_custom_as_scope_rule.md` — Scope rules are literal, use wildcard
- `reference_oie_password_policy_forces_enrollment.md` — Password policy overrides MFA enrollment
- `reference_nextauth_oidc_resource_indicator.md` — customFetch hook for RFC 8707
- `feedback_admin_ui_over_api_for_okta_policies.md` — Use admin UI for OIE policy changes

---

## 19. Plan File

The implementation plan lives at: `/Users/johnathan.campos/.claude/plans/floating-wishing-dragon.md`

---

## 20. Contacts

| Person | Role | Context |
|---|---|---|
| Bala Ganaparthi | Built the TokenInspector + owns bala-secures-ai tenant | Questions about A2A config, agent private keys |
| Grey | Team member | UX feedback, story validation |
| Kundan Kolhe | Manager | Review + approval on deliverables |
| Joe Witt / Kam Ahuja | Okta PS | MCP Bridge deployment questions |
| Anton / Jeff | Product | Agent Gateway deep-dives |
