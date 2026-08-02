const timing = Object.freeze({
  stinger: 1200,
  mystery: 4200,
  reveal: 3600,
  transition: 900,
});

export const cards = [
  {
    id: "suqami-passport",
    evidenceIds: ["2001-suqami-passport-001"],
    question: "WHAT WAS FOUND NEAR THE WORLD TRADE CENTER ON 9/11?",
    reveal: "A HIJACKER'S PASSPORT.",
    detail:
      "A 9/11 Commission staff report says NYPD Detective Yuk H. Chin received Satam al-Suqami's passport from an unidentified passerby while debris fell from the South Tower, then gave it to the FBI that day.",
    sources: [
      {
        label: "9/11 Commission staff report · 2004",
        url: "https://www.govinfo.gov/content/pkg/GOVPUB-Y3-PURL-LPS53197/pdf/GOVPUB-Y3-PURL-LPS53197.pdf",
      },
    ],
    timing,
    visual: { kind: "passport" },
  },
  {
    id: "silverstein-lease",
    evidenceIds: ["2001-silverstein-001", "2001-silverstein-002"],
    question: "WHO TOOK OVER THE WTC LEASE 49 DAYS BEFORE 9/11?",
    reveal: "LARRY SILVERSTEIN. INSURANCE RECOVERY: $4.55 BILLION.",
    detail:
      "The Port Authority says Silverstein entities entered 99-year World Trade Center leases on July 24, 2001. Its 2007 financial statement reports about $4.57 billion in total insurance recovery; a New York State Comptroller review gives the rounded total as $4.55 billion and records how the final settlement was divided.",
    sources: [
      {
        label: "Port Authority · 2007 financial statement",
        url: "https://www.panynj.gov/content/dam/corporate/financial-statements/financial-statement-2007.pdf",
      },
      {
        label: "New York State Comptroller · financial-plan review",
        url: "https://www.osc.ny.gov/files/reports/osdc/pdf/report-3-2008.pdf",
      },
    ],
    timing,
    visual: { kind: "lease" },
  },
  {
    id: "mkultra-lsd",
    evidenceIds: ["1953-mkultra-001"],
    question: "WHAT DID THE CIA GIVE PEOPLE WITHOUT TELLING THEM?",
    reveal: "LSD — UNDER MKULTRA.",
    detail:
      "At a 1977 Senate hearing, CIA Director Stansfield Turner described covert drug testing on unwitting people under MKULTRA. LSD was among the substances used.",
    sources: [
      {
        label: "U.S. Senate · MKULTRA joint hearing · 1977",
        url: "https://www.intelligence.senate.gov/sites/default/files/hearings/95mkultra.pdf",
      },
      {
        label: "CIA Reading Room · MKULTRA collection",
        url: "https://www.cia.gov/readingroom/collection/mkultra",
      },
    ],
    timing,
    visual: { kind: "mkultra" },
  },
];
