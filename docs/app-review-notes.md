# Intentus App Review Notes

Use this text in the App Store Connect App Review Information field.
Replace [REDACTED] placeholders with actual credentials before submission. Do not commit real passwords to this file.

---

## What Intentus Does

Intentus is an AI-powered operating system for founders, executives, and professional coaches. It helps leaders clarify priorities, track behavioral patterns, and build execution rhythm through structured self-reflection, recurring check-ins, and an AI coaching conversation. It is not medical advice, therapy, financial advice, or crisis support.

---

## Demo Access

**Primary demo account:**
- Email: [REDACTED]
- Password: [REDACTED]

**If the demo account is unavailable**, use the built-in reviewer path:

1. Open Intentus on the review device.
2. Tap **Sign In**.
3. Tap **Continue with App Review Demo** (visible on the sign-in screen).
4. The app opens App Review Demo Mode — a dedicated reviewer flow with pre-populated feature walkthroughs, AI disclosure details, and all three subscription purchase buttons.

This path is always available regardless of production account state or password expiry.

---

## Subscription Purchase Flow

**Product identifiers and prices:**

| Product | ID | Price |
|---|---|---|
| Intentus Executive | `intentus_executive_monthly` | $39.99/month |
| Intentus Premium | `intentus_premium_monthly` | $79.99/month |
| Intentus Coach | `intentus_coach_monthly` | $299.99/month |

All three are auto-renewing monthly subscriptions. All purchases are handled by Apple In-App Purchase through RevenueCat. The iOS app does not use external web checkout for digital subscriptions.

**To review the purchase flow:**

1. Tap **Continue with App Review Demo** from the sign-in screen, or sign in with the expired-subscription demo account.
2. The starting state has no active entitlement.
3. Tap **Load products** to fetch the current RevenueCat/App Store Connect offering.
4. Tap **Review Executive Purchase**, **Review Premium Purchase**, or **Review Coach Purchase**.
5. Apple's native StoreKit sandbox purchase sheet opens.
6. Tap **Restore Purchases** to verify restore behavior.

**To review the purchase flow from within the app:**

1. Sign in with the demo account.
2. Tap **Subscribe** from the dashboard or nav.
3. Plan cards show live StoreKit prices ($39.99 / $79.99 / $299.99 as fallback if StoreKit is unavailable).
4. Each card shows: plan name, price per month (/mo), and feature list.
5. Footer reads: *"Payment is handled by Apple. Manage or cancel subscriptions in your Apple ID subscription settings. By subscribing, you agree to our Terms of Use and Privacy Policy."*
6. Both **Terms of Use** and **Privacy Policy** are tappable links.

---

## Terms of Use and Privacy Policy (Guideline 3.1.2c)

**In the purchase flow:**
- Subscribe screen (`/subscribe`): footer beneath plan cards includes tappable **Terms of Use** and **Privacy Policy** links, plus the text: *"By subscribing, you agree to our Terms of Use and Privacy Policy."*
- App Review Demo screen (`/review-demo`): footer reads: *"By subscribing, you agree to our Terms of Use and Privacy Policy. Subscriptions auto-renew monthly. Manage or cancel in Apple ID settings."*

**Standalone pages:**
- Terms of Use: `/terms` in-app · https://intentusai.com/terms
- Privacy Policy: `/privacy` in-app · https://intentusai.com/privacy

**Verification steps:**
1. Open App Review Demo → scroll to subscription section → scroll to bottom → tap **Terms of Use** → Terms page loads with auto-renewal language, pricing, and account deletion info.
2. Tap **Privacy Policy** → Privacy page loads.
3. Sign in → go to `/subscribe` → scroll to bottom → both links functional.

---

## Subscription Disclosure Summary (Guideline 3.1.2c)

Each plan card on the Subscribe screen shows:
- **Title**: Intentus Executive / Premium / Coach
- **Billing period**: Monthly (displayed as `/mo`)
- **Price**: Live from StoreKit; fallback: $39.99 / $79.99 / $299.99
- **Auto-renewal notice**: Footer states Apple manages billing and cancellation
- **Links**: Terms of Use and Privacy Policy in the purchase footer

The Terms of Use page (`/terms`) includes a dedicated **Subscriptions and Auto-Renewal** section that covers: auto-renewal mechanics, cancellation via Apple ID settings, no partial-period refunds, and current pricing.

---

## Features and What Each Tier Unlocks

### Starter (Free)
- Operating audit (24 structured self-reflection questions)
- AI-generated 90-day operating snapshot
- Basic dashboard with recent check-ins
- No AI coaching chat

### Executive ($39.99/month)
- Full AI operating audit and strategic report
- AI check-in debriefs after every check-in
- AI Operating Coach chat (persistent conversation history)
- Drift detection and commitment tracking
- Exportable operating plan (.txt)
- North Star goal setting (1/3/5-year goals)
- 90-day plan milestone tracking and inline editing

### Premium ($79.99/month)
- Everything in Executive
- Mirror Mode: sharper AI call-outs on contradictions, avoidance, and drift
- Rotating coaching signal questions (smart staleness rotation)
- Quarterly re-audits with audit history comparison
- AI Plan Refresh: updates remaining 90-day plan phases based on actual check-in patterns
- Pattern Intelligence: longitudinal behavioral analysis across multiple audit cycles

### Coach ($299.99/month)
- Everything in Premium
- Unlimited client accounts
- Assign clients to any subscription tier
- View client audits, reports, and check-ins
- Coach annotation layer: notes, flags, session prep items, and action items per client
- Session prep card: mood trends, recurring blockers, drift warnings before each client session
- White-label branding support
- Shareable client invite links

---

## AI Features

**AI service:** Lovable AI Gateway → Google Gemini 2.5 Pro (report generation, plan refresh, pattern intelligence) and Gemini 2.5 Flash (coaching chat, audit coaching, check-in debrief).

**All AI calls are server-side.** The iOS app does not call AI providers directly. Requests go from the app to Supabase Edge Functions, which route to the AI gateway. No AI SDK is embedded in the iOS binary.

**Data processed by AI (minimum necessary per feature):**

| Feature | Data sent to AI |
|---|---|
| Strategic report generation | Audit answers (24 questions), coaching tone preference |
| AI coaching chat | Check-in history, strategic report, weekly commitments, follow-through rate, coaching tone |
| Check-in debrief | Current check-in answers, recent check-in trends, weekly commitment |
| Plan refresh | Original 90-day plan, last 12 check-ins, 8 weeks of commitment outcomes |
| Pattern intelligence | All strategic report summaries across audit cycles |
| Audit coaching | Current question + answer, section context, coaching tone |

**No health data, financial data, legal data, or crisis information is required or requested.**
**User data is not sold or used for advertising.**

---

## Account Creation and Deletion

Account creation requires email + password or an invite link from a coach.

Account deletion:
1. Sign in → Dashboard → tap profile icon → **Settings**.
2. Scroll to the bottom → **Delete Account**.
3. Check the confirmation checkbox → tap **Delete my account**.
4. App calls the `delete-account` edge function, removes all user data, and signs out.

Active Apple subscriptions must be cancelled separately through Apple ID settings. The Terms of Use and in-app deletion screen both state this.

---

## Permissions

| Permission | Why it's used | When it's requested |
|---|---|---|
| None currently required | Intentus does not request microphone, camera, location, contacts, or notifications | — |

The app does not use push notifications, location services, camera, microphone, or HealthKit in the current build.

---

## Business Model Q&A

**Who uses paid subscriptions?**
Individual leaders (founders, executives, business owners) subscribe to Executive or Premium for personal operating coaching. Professional coaches and accountability providers subscribe to Coach for client management and oversight workflows.

**Where are iOS subscriptions purchased?**
Exclusively through Apple In-App Purchase. RevenueCat manages entitlement state. No external web checkout is used for iOS digital content.

**What subscriptions can be restored?**
- `intentus_executive_monthly`
- `intentus_premium_monthly`
- `intentus_coach_monthly`

Restore Purchases is available on the Subscribe screen and in App Review Demo.

**Is any paid content unlocked outside of IAP?**
No. All paid iOS features are gated by Apple IAP entitlements managed through RevenueCat. The free Starter tier provides limited audit and reflection functionality without a subscription.

---

## Notes for Reviewers

- Intentus is a self-reflection and coaching tool for adults. It is not medical care, therapy, mental health treatment, legal advice, financial advice, or crisis support.
- If a product-unavailable error appears, confirm the build is attached to all three App Store Connect IAP products and that the RevenueCat offering includes the product identifiers listed above.
- The App Review Demo path (`/review-demo`) does not require a signed-in account and always starts in an unsubscribed state — it is specifically designed for reviewer access to the purchase flow.
- Terms of Use: https://intentusai.com/terms
- Privacy Policy: https://intentusai.com/privacy
- Support: support@intentusai.com
