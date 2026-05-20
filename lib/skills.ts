export type SkillStatus = "available" | "coming_soon";

export interface Skill {
  id: string;
  title: string;
  description: string;
  averageTime: string;
  status: SkillStatus;
  href?: string;
}

export const SKILLS: Skill[] = [
  {
    id: "prospect-dossier",
    title: "Prospect Dossier",
    description:
      "One-page brief on a target company: signals, pain points, contacts, opening line.",
    averageTime: "60 to 90 seconds",
    status: "available",
    href: "/skills/prospect-dossier",
  },
  {
    id: "deal-debrief",
    title: "Deal Debrief",
    description:
      "Turn a discovery call into a structured debrief with next steps and risks.",
    averageTime: "45 seconds",
    status: "coming_soon",
  },
  {
    id: "account-plan",
    title: "Account Plan",
    description:
      "12-month plan for a named account: whitespace, contacts, milestones.",
    averageTime: "2 minutes",
    status: "coming_soon",
  },
  {
    id: "qbr-builder",
    title: "QBR Builder",
    description:
      "Quarterly business review deck draft from CRM and product data.",
    averageTime: "90 seconds",
    status: "coming_soon",
  },
  {
    id: "pricing-defense",
    title: "Pricing Defense",
    description:
      "Talk track and proof points for defending price against a competitor.",
    averageTime: "30 seconds",
    status: "coming_soon",
  },
  {
    id: "rfp-responder",
    title: "RFP Responder",
    description: "First-draft answers to a wholesale-distribution RFP.",
    averageTime: "3 minutes",
    status: "coming_soon",
  },
  {
    id: "territory-map",
    title: "Territory Map",
    description:
      "Prioritized account list for a territory, sorted by revenue potential.",
    averageTime: "2 minutes",
    status: "coming_soon",
  },
  {
    id: "win-loss",
    title: "Win/Loss Analysis",
    description:
      "Pattern recognition across recent wins and losses for one product line.",
    averageTime: "60 seconds",
    status: "coming_soon",
  },
  {
    id: "rep-coaching",
    title: "Rep Coaching Brief",
    description:
      "Manager-ready coaching notes from a single rep's last 30 days.",
    averageTime: "45 seconds",
    status: "coming_soon",
  },
  {
    id: "pipeline-review",
    title: "Pipeline Review",
    description:
      "Stage-by-stage commentary on a rep's open pipeline with action items.",
    averageTime: "90 seconds",
    status: "coming_soon",
  },
  {
    id: "competitor-watch",
    title: "Competitor Watch",
    description:
      "Quarterly read on a named competitor: moves, hires, pricing signals.",
    averageTime: "60 seconds",
    status: "coming_soon",
  },
  {
    id: "supplier-brief",
    title: "Supplier Brief",
    description:
      "Brief on a supplier partner: lines, programs, recent news, contacts.",
    averageTime: "60 seconds",
    status: "coming_soon",
  },
  {
    id: "exec-summary",
    title: "Executive Summary",
    description:
      "Roll-up of the week's activity for a leadership audience.",
    averageTime: "30 seconds",
    status: "coming_soon",
  },
];

export type ConnectionProvider =
  | "hubspot"
  | "salesforce"
  | "close"
  | "pipedrive"
  | "outlook"
  | "gmail";

export type ConnectionCategory = "crm" | "email";

export interface ProviderTile {
  id: ConnectionProvider;
  label: string;
  category: ConnectionCategory;
}

export const CONNECTION_PROVIDERS: ProviderTile[] = [
  { id: "hubspot", label: "HubSpot", category: "crm" },
  { id: "salesforce", label: "Salesforce", category: "crm" },
  { id: "close", label: "Close", category: "crm" },
  { id: "pipedrive", label: "Pipedrive", category: "crm" },
  { id: "outlook", label: "Microsoft 365 (Outlook)", category: "email" },
  { id: "gmail", label: "Google Workspace (Gmail)", category: "email" },
];

export const DOSSIER_PHASES = [
  "Pulling baseline (web search)",
  "Identifying contacts",
  "Checking strategic signals (past 90 days)",
  "Mapping pain points",
  "Checking prior touchpoints (CRM + email)",
  "Generating document",
] as const;
