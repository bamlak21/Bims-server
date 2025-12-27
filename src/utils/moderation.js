import { Commission } from "../models/commision.model.js";

const PHONE_REGEX = /\b(?:\+251|0)[97]\d{8}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const TELEGRAM_REGEX = /(?:@|t\.me\/)[a-zA-Z0-9_]{5,}/g; // Username at least 5 chars
const WHATSAPP_REGEX = /(?:wa\.me\/|whatsapp\.com\/send\?phone=)(?:\+?251|0)?[97]\d{8}/g;

// Address keywords (Basic heuristic for common Ethiopian address patterns)
const ADDRESS_REGEX = /\b(?:Addis Ababa|Subcity|Woreda|Kebele|House No|Bole|Arada|Yeka|Nifas Silk|Kirkos|Gullele|Lideta|Akaki|Kaliti)\b/gi;

const MASK_TEXT = "*** Contact sharing is restricted until deal confirmation";

export const maskSensitiveData = (text) => {
    if (!text) return text;
    let masked = text;
    masked = masked.replace(PHONE_REGEX, MASK_TEXT);
    masked = masked.replace(EMAIL_REGEX, MASK_TEXT);
    masked = masked.replace(TELEGRAM_REGEX, MASK_TEXT);
    masked = masked.replace(WHATSAPP_REGEX, MASK_TEXT);
    masked = masked.replace(ADDRESS_REGEX, MASK_TEXT);
    return masked;
};

export const shouldMaskContent = async (listingId) => {
    if (!listingId) return true; // Safety default: mask

    try {
        // Check if a completed/paid commission exists for this listing
        const commission = await Commission.findOne({ listing_id: listingId });

        if (!commission) return true; // No commission record found -> Pre-deal -> Mask

        // Check if commission is fully paid
        // "Before commission status paid both actors"
        // We check if the status is 'paid' OR both individual statuses are 'paid'
        if (commission.status === 'paid') return false;

        if (commission.client_payment_status === 'paid' && commission.owner_payment_status === 'paid') {
            return false;
        }

        return true; // Pending or partial payment -> Mask
    } catch (error) {
        console.error("Error checking commission for masking:", error);
        return true; // Fail safe -> Mask
    }
};
