# RIVERS — Product Specification & Feature Roadmap

**Community Impact Platform for Rwanda**

*The accountability moat, the three core surfaces, and what to build next*

Version 2.0 — comprehensive · A build-and-pitch reference

---

## How to read this document

This specification is organised around one strategic conviction: **RIVERS does not win by having more features than its competitors. It wins by going deeper than anyone else on a single axis — accountability, the ability to prove where a donation actually goes.** Every recommendation here is sorted by whether it deepens that axis or merely widens the surface area of the product.

The document has four parts:

- **Part 1 — Strategy.** Why accountability is the moat, and what the competitive landscape shows.
- **Part 2 — The three core surfaces.** The money-to-impact trace, the beneficiary register, and the shareable impact report. These already have working foundations; the task is to deepen and stage them.
- **Part 3 — The feature roadmap.** Everything else, sorted into three tiers: build now, build if the audience demands it, and deliberately resist.
- **Part 4 — Build priority and aesthetic direction.** What order to build in, and how the look carries the depth.

---

## Part 1 — Strategy

### 1.1 The core conviction

RIVERS already has a working MoMo donation flow. That is necessary, but it is not a moat: any developer can wire up Mobile Money, and a personal MoMo number already accepts donations for free. The two nearest competitors both already have MoMo. So "we accept MoMo" is not a sellable difference.

> **The position to own:** Don't sell "donate via MoMo." Sell **"give, and watch exactly where it goes."** Depth on accountability is simultaneously the way to "do a lot, well" and the way to "stand out," because it is depth in the one direction the whole category is shallow.

### 1.2 Why depth, not breadth

The instinct when a product feels unremarkable is to add features. For RIVERS that instinct is a trap. Every competitor also does a lot, so a longer feature list just makes RIVERS one more comprehensive-looking platform in the pile — depth-as-feature-count is invisible. Depth only becomes impressive when it is depth in one direction nobody else goes deep in.

Concretely, the difference between shallow and deep on the one axis:

| Shallow (forgettable) | Deep (impressive and distinctive) |
|---|---|
| "RWF 750,000 raised" | A live ledger: every shilling in, every shilling out, what each purchase was, a photo of each receipt. |
| "Funds go to the campaign" | A money map: your RWF 5,000 traced to the specific kit, given to the specific pupil, on this date. |
| "147 children helped" | 147 individual, verified beneficiary records, each with what they received and when, browsable. |
| A thank-you message | A running impact feed the sponsor can revisit for months as outcomes keep landing. |

**The discipline that makes depth work: deep but staged.** A visitor sees a clean, beautiful summary first — one number, one face, one photo — and the full forensic detail is available when they choose to dig. Depth on demand, not depth dumped on arrival. Get the staging wrong and deep becomes overwhelming; get it right and it is the most trustworthy thing they have seen.

### 1.3 What the competitive landscape shows

A scan of the market in mid-2026 confirms RIVERS is not alone, but reveals an unoccupied seat that fits it precisely.

| Competitor | What they are | Why they are not RIVERS |
|---|---|---|
| **Foreign generalists** (GoFundMe, GoGetFunding, Chuffed, GlobalGiving) | Global crowdfunding sites that technically accept Rwandan campaigns. | No MoMo-native flow, high fees, Rwanda just one country option. Shallow on accountability. |
| **Chango** (Rwanda) | National-Bank-approved savings-and-investment-group platform with MoMo; crowdfunding is a side feature. | Centred on pooling money, not tracing the donor-to-beneficiary chain. Different job. |
| **EveryGiving** (Ghana) | MoMo-native giving with mandatory national-ID verification, funds direct to fundraiser, guided storytelling. | Proves the thesis works, but built for individual fundraisers and not in Rwanda. Transparency is a promise, not a full trace. |

**The takeaway:** Chango owns savings groups; EveryGiving owns individuals; nobody owns *structured, accountable community campaigns* — leaders, beneficiaries, volunteers, and a deep audit trail. That is RIVERS's seat.

Two consequences are now table stakes, because competitors have made donors expect them: **campaign-creator identity verification**, and explicit **"funds go direct" transparency**. Their absence reads as a red flag.

---

## Part 2 — The three core surfaces

These three are one trust system seen from three angles. The first produces the truth, the second is the depth beneath it, the third broadcasts it. Build them as a set; their coherence is itself part of doing "a lot, well."

### 2.1 Surface A — Money-to-impact trace

**The moat. Build and deepen first.** *Builds on data RIVERS already has.*

**The idea.** Instead of stopping at "RWF 750,000 raised," show the full chain — money in, money spent, what it bought, who it reached — so a sponsor can see the specific outcome of their specific donation.

**The staged view, top to bottom:**

1. A verified badge and campaign title, so trust is established before any number.
2. An accountability ratio: "RWF 712,500 of 750,000 accounted for · 95% traced," with a progress bar. Honest and specific beats a single raised figure.
3. Three summary cards: raised, spent, reached.
4. A personal attribution line: "Your RWF 5,000 funded one full school kit, received by a Primary 4 pupil on 5 June."
5. The full trail: each purchase as a collapsed row that expands to show what it bought, how many children it reached, and a receipt photo. The depth, available on tap, not dumped on arrival.

**The data model:**

- **Donation** — who gave, how much, when, which campaign. (Exists.)
- **Expenditure** — a spend event: amount, date, description, receipt/delivery photo, optional link to the budget line. (New, simple — reuses existing image storage.)
- **Beneficiary outcome** — a specific beneficiary received specific assistance, optionally tied to an expenditure. (Extends data already tracked.)

The value is the linkage: campaign → expenditures → beneficiary outcomes. Once those links exist, the chain renders itself.

**Scope discipline.** *Resist:* formal audit-grade bookkeeping, line-item accounting, multi-currency. A photo of a receipt earns more trust than a spreadsheet of numbers, at a fraction of the cost.

### 2.2 Surface B — Beneficiary register

**The depth beneath the trace.** *Where "147 children" becomes 147 verified records.*

**The idea.** A browsable register of every beneficiary reached, each with the assistance received, the date, and a verified-delivery mark. Filterable by grade or cohort. This is the layer that turns a headline number into auditable proof.

> **The non-negotiable: privacy of minors.** These are children. The same depth that builds trust with sponsors becomes a child-safety liability if it exposes real names, faces, and locations of identifiable minors to strangers who have paid. The register must prove delivery — record IDs, grades, kit contents, verification status — *without* surfacing personal identities. "Verified but anonymised" is the line to hold. It is also the more defensible position if a reviewer or regulator asks how RIVERS handles data on children.

**What each record shows:**

- A protected initial and record ID (e.g. "BNF-014"), never a full name.
- Grade and age band, not identifying detail.
- The kit received (full or core) and the date.
- A verified-delivery mark, tying back to the expenditure that funded it.

**Scope discipline.** *Resist:* photos of identifiable children, public names, or exposing the raw register without the privacy layer. Curated proof, never a database dump of minors.

### 2.3 Surface C — Shareable impact report

**The growth engine. Build second.** *Extends the client-side PDF generation RIVERS already does.*

**The idea.** When a campaign closes, every sponsor automatically receives a clean, one-page "here's what you made possible" report — addressed to them by name, with their specific contribution traced, photos, a beneficiary or leader quote, and the verified badge — designed to be forwarded on WhatsApp and posted to social media.

**Why it sells:**

- **It is a growth loop, not a document.** A sponsor who shares their report is doing the marketing. Each share puts proof of real outcomes in front of potential donors, who arrive already trusting because they saw evidence, not an ad.
- **It reframes a feature already built.** The shift is from a back-office export to a marketing object with a person's name on it.
- **It drives repeat giving.** Closing the loop emotionally turns a one-time donor into a recurring one — which compounds with recurring giving (Part 3).

**The share mechanics that matter:**

- One-tap WhatsApp share first — it is the dominant channel in Rwanda; everything else is secondary.
- A public link that unfurls with a proper preview image, headline, and a face — the unfurled card is the advert.

**The honest caveat.** *Guardrail:* the moment RIVERS auto-generates emotional language about children, add a light review step so a leader confirms it is accurate and not overclaiming. Proof platforms live or die on never exaggerating.

---

## Part 3 — The feature roadmap

Everything beyond the three core surfaces, sorted by a single test: does it deepen the accountability axis, or merely widen the surface area? The tiers below are that test made explicit.

### 3.1 Tier 1 — Deepens the moat (build these)

Each of these makes the accountability story richer, so they compound rather than dilute. Notice they are all the same feature family — proving where money goes, from more angles. That is deliberate: the way to win a vertical is to own it completely while competitors stay shallow.

**Feature 1 — Recurring giving.** *If only one new feature is built, this is it.*
"RWF 5,000 every month to this campaign or this leader." The highest-leverage addition not yet in the build.

- It is the single thing investors care most about — predictable recurring revenue turns a donation tool into a business.
- It converts one-time donors into a base, lifting lifetime value.
- It compounds with the impact report: every month, fresh proof lands, which sustains the habit.

*Build: a recurring schedule on the donation, a way to pause or stop, and a monthly trigger that reuses the existing MoMo flow.*

**Feature 2 — Leader expenditure logging with photo receipts.** *The engine room. Without it, the trace is fiction.*
The input side of Surface A. The three core surfaces are only real if leaders can easily enter the spending and outcome data that powers them.

- A simple form: amount, what it was for, date, photo of the receipt or delivery.
- A way to mark which beneficiaries an expenditure reached.
- Reuses existing image storage; this is plumbing, but it is load-bearing plumbing.

**Feature 3 — Beneficiary feedback loop.**
Let a beneficiary, or a leader on their behalf, confirm "yes, I received this" — optionally with a photo or a one-line thank-you.

- Closes the trust loop from the receiving end, which no competitor does.
- Makes verification bulletproof: delivery is confirmed by both sides, not asserted by one.
- Must respect the same minor-privacy rules as the register.

**Feature 4 — Staged disbursement milestones.**
Release and track funds in stages tied to proof: books bought → photo → next tranche.

- Removes the black box between "raised" and "spent."
- Deepens accountability in exactly the winning direction, and reassures larger or institutional donors.

### 3.2 Tier 2 — Useful, audience-dependent (build if the audience demands it)

Genuinely valuable, but each serves a specific buyer rather than the core story. Build the one that matches the audience in the room.

| Feature | What it does | When to build it |
|---|---|---|
| **Leader / org reporting dashboard** | Auto-generates the impact reports NGOs already produce for their own funders. | If NGOs are the wedge. This is what makes an NGO unable to leave — strong retention. |
| **Multi-channel payments (Airtel Money)** | Adds Airtel alongside MTN MoMo. | For reach in Rwanda; Chango is already moving here. Plumbing, not a wow. |
| **Sponsor giving history + year-end summary** | "You gave RWF 200k, reached 60 people this year." | Light to build; aids retention; pairs naturally with recurring giving. |
| **Deeper volunteer matching** | Skills, scheduling, and real matching on the existing volunteer role. | Only if volunteering is genuinely central to the pitch. Otherwise it dilutes focus. |

### 3.3 Tier 3 — The tempting traps (deliberately resist)

Each of these sounds impressive and makes the product worse right now: common in the category (so they do not help RIVERS stand out), high-maintenance, and corrosive to the focused trust story. A half-finished version of any of them actively undermines credibility, which reads — in a giving context — as "might be a scam."

| Tempting feature | Why to resist it (for now) |
|---|---|
| **Badges, points, streaks, donor leaderboards** | Vanity gamification. Cheapens giving and introduces the wrong emotion — status and competition between sponsors — for a dignity-centred platform. |
| **In-app chat, social feed, comments** | High maintenance, breaks easily, opens a moderation burden, and does nothing to answer "where did my money go." |
| **AI matching / AI anything** | Sophistication theatre: looks advanced in a demo, finished by no one, used by few. Adds risk without deepening the moat. |
| **Multi-currency / international expansion** | Not the niche, not the readiness. Dilutes the Rwanda-community focus that is the whole differentiator. |
| **Native mobile app** | Responsive web already reaches phone users. A native app is months of work for marginal pre-launch gain. |

> **The pattern to internalise:** a reviewer who sees recurring giving + photo receipts + beneficiary confirmation + staged disbursement thinks "this team is serious about accountability in a way nobody else is." A reviewer who sees accountability + chat + badges + leaderboards thinks "unfocused." Same effort, opposite impression.

---

## Part 4 — Build priority and aesthetic direction

### 4.1 Recommended build order

| Stage | Build | Why now |
|---|---|---|
| **1** | Leader expenditure logging (Tier 1, Feature 2). Surface A trace view reading that data. Plus: verified badge + visible leader identity. | The trace is the moat and the source of all other proof. Logging is the engine that makes it real. The trust signals are launch-critical at the moment of donation. |
| **2** | Surface B beneficiary register, with the privacy layer. Surface C impact report + one-tap WhatsApp share. | Once the trace produces real data, the register proves its depth and the report broadcasts it, starting the growth loop. |
| **3** | Recurring giving (Tier 1, Feature 1). Beneficiary feedback loop (Tier 1, Feature 3). | Recurring revenue and two-sided verified delivery — the retention and credibility layer once the core loop is live. |
| **4** | Staged disbursement milestones. The single best-fit Tier 2 feature for the target audience. | Deepen accountability further and serve the specific buyer once the platform is proven. |

### 4.2 Aesthetic direction — the look carries the depth

The look is not a separate workstream competing with the features; for RIVERS it is how the depth becomes legible and human rather than clinical. A deep accountability ledger can read as an intimidating spreadsheet or as a calm, trustworthy story — the design is what decides which.

- **Photo-led, not data-led.** Real imagery — receipts, delivery, faces (with the minor-privacy rules) — is the medium of the trace, not decoration around it.
- **Calm summary, depth on demand.** Clean numbers and one face up front; the forensic detail expands on tap. Simple surface, profound underneath.
- **Warm and specific, one accent colour.** A single confident accent, generous whitespace, and a donate button always reachable on mobile, since most users are on phones.
- **A distinct, locally-rooted identity.** Generic SaaS styling is the enemy of "impressive." An identity rooted in something Rwandan, rather than a default template, makes the same features feel like a different caliber of product.

**One honest dependency:** the specific visual direction should be developed against RIVERS's actual current interface, which this document is written without having seen. The principles above hold regardless; the exact colour, type, and identity work is the one piece that needs the real UI in front of it.

### 4.3 The pitch this whole plan enables, by audience

| Audience | The line this plan lets you say |
|---|---|
| **Investors / judges** | "Every donation produces a shareable proof that recruits the next donor, and recurring giving turns it into predictable revenue — in a niche no one in Rwanda occupies." |
| **NGOs / leaders** | "We do your impact reporting for you, and prove your accountability to your own funders automatically." |
| **Sponsors** | "Give, and actually see where it went — traced to the receipt and the child, verified, not just a thank-you." |

---

*End of specification*
