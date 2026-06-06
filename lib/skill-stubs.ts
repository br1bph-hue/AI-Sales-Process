// Per-skill stub metadata. The Next.js shell renders all 13 skills as
// available; for skills 2-13 the API returns canned content built from
// this table until each skill's real backend ships.

export interface SkillStubMeta {
  id: string;
  title: string;
  skillNumber: number; // 1-13 for the "Skill N of 13" eyebrow
  inputLabel: string;
  inputPlaceholder: string;
  outputTitle: string;
  sections: { heading: string; body: string }[];
}

export const SKILL_STUBS: Record<string, SkillStubMeta> = {
  "deal-debrief": {
    id: "deal-debrief",
    title: "Deal Debrief",
    skillNumber: 2,
    inputLabel: "Discovery call notes",
    inputPlaceholder:
      "Paste your notes from the call. Bullet points are fine — the skill will structure them.",
    outputTitle: "Debrief",
    sections: [
      {
        heading: "What we learned",
        body: "Buyer confirmed budget for FY26 is approved and sits with the VP of Sales Ops. Current state: a homegrown lead scoring system that nobody trusts and a HubSpot instance the team treats as a graveyard.",
      },
      {
        heading: "Risks",
        body: "Champion is two months into the role and may not have political capital yet. Procurement was not mentioned and will likely add 6-8 weeks.",
      },
      {
        heading: "Next steps",
        body: "Send 3-customer reference panel by Friday. Schedule technical fit with their RevOps lead. Confirm whether IT has standing security review windows.",
      },
    ],
  },
  "account-plan": {
    id: "account-plan",
    title: "Account Plan",
    skillNumber: 3,
    inputLabel: "Account name and current relationship",
    inputPlaceholder:
      "Example: Crescent Electric. We sell them lighting controls; ~$400K ARR; quarterly QBRs.",
    outputTitle: "12-month account plan",
    sections: [
      {
        heading: "Whitespace",
        body: "Branch automation (none today), datacenter sub-line (currently with HD Supply), and the building automation cross-sell flagged by the supplier brief.",
      },
      {
        heading: "Key contacts",
        body: "Economic buyer: VP Branch Operations. Champion: Director of Inventory. Detractor risk: Regional Manager (West) — bypassed in last RFP.",
      },
      {
        heading: "Milestones",
        body: "Q1: line review. Q2: pilot the automation SKUs in two branches. Q3: extension. Q4: renewal + expansion proposal.",
      },
    ],
  },
  "qbr-builder": {
    id: "qbr-builder",
    title: "QBR Builder",
    skillNumber: 4,
    inputLabel: "Customer and quarter",
    inputPlaceholder: "Example: Acme Distribution, Q2 2026. Highlight wins and pending issues.",
    outputTitle: "Draft QBR sections",
    sections: [
      {
        heading: "Executive summary",
        body: "On-track against the FY26 plan. Order volume up 11% QoQ; service incidents down 28% after the rollout of the new fulfillment workflow.",
      },
      {
        heading: "What worked",
        body: "Three branch pilots delivered cycle-time gains; the analytics dashboard went live one sprint ahead of plan.",
      },
      {
        heading: "Open issues",
        body: "Two integration tickets older than 45 days; a pricing review requested by the customer's CFO has not been scheduled.",
      },
    ],
  },
  "pricing-defense": {
    id: "pricing-defense",
    title: "Pricing Defense",
    skillNumber: 5,
    inputLabel: "Competitor and where you're being squeezed",
    inputPlaceholder:
      "Example: Competitor X came in 12% lower on the controllers line. We're at risk of losing the bid.",
    outputTitle: "Talk track",
    sections: [
      {
        heading: "Reframe the comparison",
        body: "The 12% gap closes once warranty terms, on-site service, and the local stocking commitment are normalized. Our delivered cost is competitive in 70% of the SKU mix.",
      },
      {
        heading: "Proof points",
        body: "Three reference customers switched back from the same competitor within 18 months over service issues. Quantified downtime cost: ~$8K/hour for a typical mid-market site.",
      },
      {
        heading: "Concession ladder",
        body: "Hold the list. If pressed: 2% volume rebate at the FY tier. Last resort: 4% on a 24-month commitment, never on month one.",
      },
    ],
  },
  "rfp-responder": {
    id: "rfp-responder",
    title: "RFP Responder",
    skillNumber: 6,
    inputLabel: "Paste the RFP question or section",
    inputPlaceholder:
      "Paste a question or whole section. The skill drafts an answer in our voice.",
    outputTitle: "Draft response",
    sections: [
      {
        heading: "Answer",
        body: "Our regional distribution network covers all 50 states from 47 stocking locations with same-day or next-day delivery to 92% of metro ZIP codes. For the customer's footprint specifically, we serve all listed sites from no more than two hubs each.",
      },
      {
        heading: "Differentiator",
        body: "Local applications engineers on staff at each branch — a model competitors have moved away from in favor of centralized call centers.",
      },
      {
        heading: "Edit before sending",
        body: "Confirm the 47 / 92% / two-hub numbers against the latest territory map. Replace the engineer count with the figure from the most recent ops review.",
      },
    ],
  },
  "territory-map": {
    id: "territory-map",
    title: "Territory Map",
    skillNumber: 7,
    inputLabel: "Territory definition",
    inputPlaceholder: "Example: Pacific Northwest, electrical line, accounts >$50K ARR.",
    outputTitle: "Prioritized accounts",
    sections: [
      {
        heading: "Tier 1 — focus this quarter",
        body: "Six accounts representing $4.8M in pipeline potential, each with a recent leadership change or expansion signal in the past 90 days.",
      },
      {
        heading: "Tier 2 — develop",
        body: "Eleven accounts with active spend but no senior relationship. Recommend an exec sponsor program touch.",
      },
      {
        heading: "Tier 3 — maintain or release",
        body: "Twenty-three accounts trending flat or down. Three are candidates to release to channel partners.",
      },
    ],
  },
  "win-loss": {
    id: "win-loss",
    title: "Win/Loss Analysis",
    skillNumber: 8,
    inputLabel: "Product line and window",
    inputPlaceholder: "Example: Industrial controls, last two quarters.",
    outputTitle: "Patterns",
    sections: [
      {
        heading: "Where we win",
        body: "Deals with a multi-site rollout and an existing service contract close at 64%. The on-site applications engineer shows up in every closed-won deal review.",
      },
      {
        heading: "Where we lose",
        body: "Single-site, new-logo deals under $75K. Buyer almost always cites price; in reality, it's the inside sales hand-off — three days of silence after the demo.",
      },
      {
        heading: "What to change",
        body: "Same-day quote turnaround on sub-$75K deals. Pull the applications engineer in earlier on multi-site deals — paying off as a leading indicator.",
      },
    ],
  },
  "rep-coaching": {
    id: "rep-coaching",
    title: "Rep Coaching Brief",
    skillNumber: 9,
    inputLabel: "Rep name and what to focus on",
    inputPlaceholder: "Example: Jordan Yu, last 30 days, focus on early-stage qualification.",
    outputTitle: "Coaching notes",
    sections: [
      {
        heading: "Strengths",
        body: "Strong technical fluency in the controls line. Buyers consistently respond well to the product walkthrough; demo-to-next-step conversion is 22 points above team average.",
      },
      {
        heading: "Gaps",
        body: "Discovery calls run short and lean on product. Of the last twelve discoveries, only three documented budget and timing. Three deals are sitting in proposal stage with no champion identified.",
      },
      {
        heading: "Drill this week",
        body: "Two role-plays on multi-threaded discovery. Pair on one live call with a senior rep. Re-score those three proposal-stage deals against MEDDIC.",
      },
    ],
  },
  "pipeline-review": {
    id: "pipeline-review",
    title: "Pipeline Review",
    skillNumber: 10,
    inputLabel: "Rep or team to review",
    inputPlaceholder: "Example: West region team, open pipeline above $50K.",
    outputTitle: "Stage-by-stage review",
    sections: [
      {
        heading: "Discovery (8 deals)",
        body: "Two have no scheduled next step. One was last touched 19 days ago — likely stalled. The other five look healthy.",
      },
      {
        heading: "Proposal (5 deals)",
        body: "One sits beyond the typical proposal age by 30%. Likely a price objection that hasn't been surfaced; recommend a manager-led check-in.",
      },
      {
        heading: "Commit (3 deals)",
        body: "Forecast looks light by ~$120K. Two of the three commit deals have an active legal redline; expect slippage of at least one to next quarter.",
      },
    ],
  },
  "competitor-watch": {
    id: "competitor-watch",
    title: "Competitor Watch",
    skillNumber: 11,
    inputLabel: "Competitor name",
    inputPlaceholder: "Example: Competitor X.",
    outputTitle: "Quarterly read",
    sections: [
      {
        heading: "Moves",
        body: "Acquired a regional specialist in October; consolidating two branches into one in the Midwest. Quietly hiring data engineers — the third such posting this quarter.",
      },
      {
        heading: "Pricing signals",
        body: "Selective list-price increases of 3-5% in the controls line. Aggressive on the lighting line where they're losing share.",
      },
      {
        heading: "What it means for us",
        body: "Branch consolidation creates a six-month coverage gap in two Midwest metros — fastest path to take share. Expect their hiring to surface a CDP-style product in Q4.",
      },
    ],
  },
  "supplier-brief": {
    id: "supplier-brief",
    title: "Supplier Brief",
    skillNumber: 12,
    inputLabel: "Supplier name",
    inputPlaceholder: "Example: Eaton, focus on lighting controls portfolio.",
    outputTitle: "Brief",
    sections: [
      {
        heading: "Lines and programs",
        body: "Primary lines we carry: A, B, and C. Active programs: the spring rebate (closes June 30) and the multi-line bundle on retrofits.",
      },
      {
        heading: "Recent news",
        body: "New VP of Channel announced last month — comes from a competitor's distribution arm. Likely emphasis on lifecycle service attach.",
      },
      {
        heading: "Contacts",
        body: "Channel manager (named), national account director (named), and a new lifecycle services lead — recommend an intro on your next QBR.",
      },
    ],
  },
  "exec-summary": {
    id: "exec-summary",
    title: "Executive Summary",
    skillNumber: 13,
    inputLabel: "Audience and week",
    inputPlaceholder: "Example: Sales leadership, week of June 1.",
    outputTitle: "Weekly roll-up",
    sections: [
      {
        heading: "Pipeline movement",
        body: "Net pipeline up $1.8M week-over-week, driven by three new mid-market opportunities in the Southeast. One enterprise deal slipped to next quarter.",
      },
      {
        heading: "Wins",
        body: "Closed-won: two mid-market expansions and one new-logo controls deal. All three credit the local applications engineer.",
      },
      {
        heading: "What needs leadership attention",
        body: "The proposal-aging problem flagged two weeks ago hasn't moved. Recommend a 30-minute working session with the affected reps' managers.",
      },
    ],
  },
};

export interface SkillStubResponse {
  request_id: string;
  status: "completed";
  duration_ms: number;
  skill_id: string;
  title: string;
  output_title: string;
  sections: { heading: string; body: string }[];
}

export function buildSkillStubResponse(
  skillId: string,
  requestId?: string,
  durationMs = 2500
): SkillStubResponse | null {
  const meta = SKILL_STUBS[skillId];
  if (!meta) return null;
  return {
    request_id: requestId ?? randomId(),
    status: "completed",
    duration_ms: durationMs,
    skill_id: skillId,
    title: meta.title,
    output_title: meta.outputTitle,
    sections: meta.sections,
  };
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
