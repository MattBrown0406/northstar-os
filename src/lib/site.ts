export const SITE_NAME = "Intentus";
export const SITE_URL = "https://intentus.ai";
export const DEFAULT_TITLE = "Intentus | AI operating accountability software for founders and executives";
export const DEFAULT_DESCRIPTION = "Intentus helps founders, executives, and operators run an honest operating audit, choose the few metrics that matter, and stay accountable to a focused 90-day plan.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description: DEFAULT_DESCRIPTION,
};

export const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "USD",
  },
  audience: {
    "@type": "BusinessAudience",
    audienceType: "Founders, executives, operators, and coaches",
  },
};

export const faqItems = [
  {
    question: "Who is Intentus for?",
    answer:
      "Intentus is built primarily for founders, executives, and operators who want a tighter operating rhythm. Coaches can also use it to run branded accountability programs for clients.",
  },
  {
    question: "What happens after the operating audit?",
    answer:
      "You receive a practical report covering strengths, blind spots, contradictions, priority metrics, and a 90-day operating plan that feeds ongoing check-ins.",
  },
  {
    question: "Does Intentus replace an executive coach or therapist?",
    answer:
      "No. Intentus is accountability software and a self-reflection tool. It helps leaders execute with more discipline, but it is not therapy, medical care, or a substitute for professional coaching.",
  },
  {
    question: "How often do check-ins happen?",
    answer:
      "Leaders can choose a daily or weekly cadence depending on how tight they want the feedback loop to be.",
  },
  {
    question: "Is my data private?",
    answer:
      "Intentus is designed for sensitive operating reflection. The product focuses on private-by-design workflows and keeps data collection centered on your audit, plan, and accountability history.",
  },
];

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};
