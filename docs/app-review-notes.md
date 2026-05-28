# Intentus App Review Notes

Use this text in App Store Connect App Review Information. Replace credential placeholders with the actual demo account values configured in Supabase/App Store Connect. Do not commit real passwords.

## Demo Access

Primary demo account:
- Username: [REDACTED]
- Password: [REDACTED]

If the demo account cannot be used for any reason, the iOS build also includes a reviewer-only demonstration path:

1. Open Intentus on the iPad/iPhone review device.
2. Tap **Sign in**.
3. Tap **Continue with App Review Demo**.
4. The app opens **Intentus App Review Demo Mode**, a read-only reviewer flow showing the core features, AI disclosures, subscription tiers, Restore Purchases, and the in-app purchase buttons.

This mode is included specifically so App Review can inspect the app even if the production demo account state or password has expired.

## Expired Subscription / Purchase Flow Review

Expired/unsubscribed review state:
- Username: [REDACTED]
- Password: [REDACTED]
- Subscription state: expired / no active entitlement

To review the purchase process:

1. Sign in with the expired-subscription demo account and open **Subscribe**, or use **Continue with App Review Demo** from the sign-in screen.
2. In App Review Demo Mode, the subscription state starts as unsubscribed/expired.
3. Tap **Load products** to load the current RevenueCat/App Store Connect offering.
4. Tap **Review Executive Purchase**, **Review Premium Purchase**, or **Review Coach Purchase**.
5. The app calls RevenueCat/StoreKit and opens Apple's native sandbox purchase sheet.
6. Tap **Restore Purchases** to inspect restore behavior.

All iOS subscription purchases are handled with Apple In-App Purchase through RevenueCat. The iOS app does not send users to an external web checkout for these digital subscriptions.

## Terms of Use and Privacy Policy (Guideline 3.1.2c)

The app now includes the following required subscription disclosure links:

- **Terms of Use** — available at `/terms` in the app and at https://intentusai.com/terms
- **Privacy Policy** — available at `/privacy` in the app and at https://intentusai.com/privacy

**Where they appear in the purchase flow:**
1. On the **Subscribe** screen (`/subscribe`), the disclosure footer beneath the plan cards reads: *"By subscribing, you agree to our Terms of Use and Privacy Policy."* Both are tappable links.
2. On the **App Review Demo** screen (`/review-demo`), the footer below the purchase section reads: *"By subscribing, you agree to our Terms of Use and Privacy Policy. Subscriptions auto-renew monthly. Manage or cancel in Apple ID settings."*

**To verify in the reviewed build:**
1. From the sign-in screen, tap **Continue with App Review Demo** → scroll to the bottom of the screen → tap **Terms of Use** → Terms page loads.
2. Tap **Privacy Policy** → Privacy page loads.
3. Sign in with the demo account → navigate to **Subscribe** → scroll to the bottom → tap **Terms of Use** and **Privacy Policy** → both pages load.

## Subscription Disclosure (Guideline 3.1.2c)

Each plan card on the Subscribe screen displays:
- **Plan name** (Executive, Premium, Coach)
- **Price per month** (loaded live from StoreKit; fallback prices shown if StoreKit unavailable: $29.99, $99.99, $399.99)
- **Billing period** (/mo label on each price)
- Subscriptions are auto-renewing monthly subscriptions managed by Apple

The footer on the Subscribe screen states: *"Payment is handled by Apple. Manage or cancel subscriptions in your Apple ID subscription settings."*

## IAP Products (Guideline 2.1b)

The three subscription products must be created and submitted for review in App Store Connect before this build can be approved. Product identifiers:

- `intentus_executive_monthly` — Intentus Executive, $29.99/month
- `intentus_premium_monthly` — Intentus Premium, $99.99/month
- `intentus_coach_monthly` — Intentus Coach, $399.99/month

All three must be attached to the app version being reviewed in App Store Connect (App Store Connect → App → Subscriptions → add to version). An App Review screenshot is required for each product.

## Business Model Answers

1. **Who uses the paid subscriptions in the app?**
   - Individual founders, executives, business owners, and leaders use Executive or Premium subscriptions for ongoing AI operating coaching, check-ins, drift detection, and strategic report depth.
   - Professional coaches or accountability providers use the Coach subscription for coach/client workflows and client accountability review.

2. **Where can users purchase subscriptions that can be accessed in the app?**
   - In the iOS app, users purchase subscriptions only through Apple In-App Purchase.
   - Subscription products are configured in App Store Connect and served to the app through RevenueCat.

3. **What specific types of previously purchased subscriptions can a user access in the app?**
   - Intentus Executive monthly: `intentus_executive_monthly`
   - Intentus Premium monthly: `intentus_premium_monthly`
   - Intentus Coach monthly: `intentus_coach_monthly`
   - Users can restore these purchases in the iOS app using **Restore Purchases**.

4. **What paid content, subscriptions, or features are unlocked within the app that do not use In-App Purchase?**
   - None for iOS digital content. Paid iOS app features are unlocked by Apple In-App Purchase entitlements.
   - The free Starter experience includes limited audit/reflection functionality. Executive, Premium, and Coach features require active subscription entitlement.

## AI Data Processing Answers

1. **What AI service processes data?**
   - Intentus uses Lovable AI Gateway for AI calls. Current server functions call the gateway with Google Gemini 2.5 Pro for strategic report generation and coaching responses.

2. **What type of data is processed by the AI service?**
   - User-provided onboarding preferences, operating-audit answers, check-in responses, weekly commitments, previous strategic report context, coaching tone preference, and app-generated accountability context needed to produce the requested coaching/report response.

3. **What personal data is processed by the AI service?**
   - Supabase-authenticated account context, optional display name, coaching preferences, self-reflection text entered by the user, check-in history, commitments, and prior report context. Intentus does not require health, financial, legal, or crisis data and tells users it is not medical, mental-health, legal, financial, or crisis advice.

## Notes for Reviewers

- Intentus is a coaching and self-reflection product for adults. It is not medical advice, mental health treatment, legal advice, financial advice, or crisis support.
- If a reviewer sees a product-unavailable message, please confirm the reviewed build is attached to the App Store Connect IAP products and that the RevenueCat current offering includes the three product identifiers listed above.
- Terms of Use: https://intentusai.com/terms
- Privacy Policy: https://intentusai.com/privacy
