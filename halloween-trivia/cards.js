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
  {
    id: "operation-northwoods",
    evidenceIds: ["1962-northwoods-001"],
    question: "WHAT DID THE JOINT CHIEFS PROPOSE STAGING IN U.S. CITIES IN 1962?",
    reveal: "TERROR ATTACKS TO BLAME ON CUBA — PART OF OPERATION NORTHWOODS.",
    detail:
      "A 1962 Joint Chiefs memorandum proposed pretexts for invading Cuba, including a terror campaign in Miami, other Florida cities, and Washington. The proposal was not carried out.",
    sources: [
      {
        label: "Declassified Joint Chiefs memorandum · 1962",
        url: "https://nsarchive.gwu.edu/CMC-60/joint-chiefs-pretexts-to-invade-Cuba-1962",
      },
    ],
    timing,
    visual: { kind: "northwoods" },
  },
  {
    id: "cia-dart-pistol",
    evidenceIds: ["1975-heart-attack-gun-001"],
    question: "WHAT SECRET WEAPON DID THE CIA SHOW THE SENATE IN 1975?",
    reveal: "A PISTOL THAT FIRED A TINY POISON DART — DESIGNED TO KILL WITHOUT AN OBVIOUS TRACE.",
    detail:
      "At a September 1975 Church Committee hearing, CIA Director William Colby displayed a pistol modified to fire a tiny toxin dart. Testimony said the wound and toxin were designed to be difficult to detect.",
    sources: [
      {
        label: "Church Committee intelligence-activities hearing · 1975",
        url: "https://intelligence.senate.gov/sites/default/files/94intelligence_activities_I.pdf",
      },
    ],
    timing,
    visual: { kind: "dart-pistol" },
  },
  {
    id: "uss-liberty",
    evidenceIds: ["1967-uss-liberty-001"],
    question: "WHICH U.S. NAVY SHIP DID ISRAELI FORCES ATTACK OFF GAZA IN 1967?",
    reveal: "THE USS LIBERTY — 34 AMERICANS WERE KILLED. ISRAEL SAID IT WAS MISTAKEN IDENTITY.",
    detail:
      "The National Security Agency says Israeli fighters and torpedo boats attacked USS Liberty 25 miles off Gaza on June 8, 1967, killing 34 Americans. Israel described it as an identification error, and the U.S. government accepted that explanation.",
    sources: [
      {
        label: "National Security Agency · USS Liberty history",
        url: "https://www.nsa.gov/History/National-Cryptologic-Museum/Exhibits-Artifacts/Exhibit-View/Article/2718838/cold-war-uss-liberty/",
      },
    ],
    timing,
    visual: { kind: "uss-liberty" },
  },
  {
    id: "united-put-options",
    evidenceIds: ["2001-put-options-001"],
    question: "WHAT OUTNUMBERED UNITED AIRLINES CALL OPTIONS BY MORE THAN 20 TO 1 FIVE DAYS BEFORE 9/11?",
    reveal: "PUT OPTIONS — BETS THAT THE STOCK WOULD FALL. INVESTIGATORS LATER REPORTED NO 9/11 FOREKNOWLEDGE.",
    detail:
      "The 9/11 Commission staff reported that United Airlines put volume on September 6 exceeded call volume by more than 20 to 1. The SEC and FBI traced the trades and reported no evidence of advance knowledge.",
    sources: [
      {
        label: "9/11 Commission · terrorist-financing monograph",
        url: "https://govinfo.library.unt.edu/911/staff_statements/911_TerrFin_Monograph.pdf",
      },
    ],
    timing,
    visual: { kind: "put-options" },
  },
];
