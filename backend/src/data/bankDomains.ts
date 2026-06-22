export const BANK_DOMAINS = new Set([
    // HDFC Bank
    "hdfcbank.bank.in",
    "hdfcbank.com",
    "hdfcbank.net",

    // ICICI Bank
    "icicibank.com",

    // Axis Bank
    "axisbank.com",

    // State Bank of India
    "sbi.co.in",
    "sbibank.in",
    "sbi.com",

    // Kotak Mahindra Bank
    "kotak.com",
    "kotakmahindra.com",

    // IndusInd Bank
    "indusind.com",

    // YES Bank
    "yesbank.in",

    // IDFC FIRST Bank
    "idfcfirstbank.com",

    // Federal Bank
    "federalbank.co.in",

    // RBL Bank
    "rblbank.com",

    // Bandhan Bank
    "bandhanbank.com",

    // South Indian Bank
    "sib.co.in",

    // Karnataka Bank
    "ktkbank.com",

    // Karur Vysya Bank
    "kvbmail.com",
    "karurvysyabank.co.in",

    // City Union Bank
    "cityunionbank.com",

    // DCB Bank
    "dcbbank.com",

    // Tamilnad Mercantile Bank
    "tmbnet.in",

    // Jammu & Kashmir Bank
    "jkbank.com",

    // Punjab National Bank
    "pnb.co.in",
    "pnbbank.in",

    // Bank of Baroda
    "bankofbaroda.com",
    "bankofbaroda.bank.in",

    // Canara Bank
    "canarabank.com",
    "canarabank.in",

    // Union Bank of India
    "unionbankofindia.bank.in",

    // Indian Bank
    "indianbank.co.in",

    // Indian Overseas Bank
    "iob.in",

    // Bank of India
    "bankofindia.co.in",

    // Central Bank of India
    "centralbank.co.in",

    // UCO Bank
    "ucobank.co.in",

    // Punjab & Sind Bank
    "psb.co.in",

    // Bank of Maharashtra
    "bankofmaharashtra.in",
]);

/**
 * Extracts the domain from an email address or "Display Name <email>" format.
 * Returns the lowercase domain, or null if parsing fails.
 */
function extractDomain(from: string): string | null {
    const match = from.match(/<([^>]+)>/) ?? from.match(/(\S+@\S+)/);
    const email = match?.[1] ?? from.trim();
    const atIndex = email.lastIndexOf("@");
    if (atIndex === -1) return null;
    return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Returns true if the sender's email domain matches a known Indian bank domain.
 */
export function isFromKnownBank(from: string): boolean {
    const domain = extractDomain(from);
    if (!domain) return false;
    return BANK_DOMAINS.has(domain);
}

/**
 * Builds a Gmail search `from:` filter covering all known bank domains.
 * e.g. "from:(@hdfcbank.com OR @icicibank.com OR ...)"
 */
export function buildBankFromFilter(): string {
    const parts = [...BANK_DOMAINS].map(d => `@${d}`).join(" OR ");
    return `from:(${parts})`;
}
