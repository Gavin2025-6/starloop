function hasConsent(customer) {
  return Boolean(customer && customer.consent);
}

function hasOpenIssue(customer, review) {
  return Boolean(customer && customer.openIssue) || Boolean(review && review.status === "unresolved");
}

function isPromoter(review) {
  return Number(review.rating) >= 5;
}

function isAtRisk(review) {
  return Number(review.rating) <= 3 || /wait|angry|refund|late|overwhelmed|confusing/i.test(review.content || "");
}

function canSendReviewRequest(customer, review) {
  if (!hasConsent(customer)) {
    return {
      allowed: false,
      reason: "No consent on record.",
    };
  }

  if (hasOpenIssue(customer, review)) {
    return {
      allowed: false,
      reason: "Customer has an unresolved issue. Create a recovery task before sending new requests.",
    };
  }

  if (customer.lastContactDaysAgo < 2) {
    return {
      allowed: false,
      reason: "Customer was contacted recently. Cooldown protects trust.",
    };
  }

  return {
    allowed: true,
    reason: "Consent, cooldown, and open-issue checks passed.",
  };
}

function canSuggestGift(review) {
  if (!review || !isAtRisk(review)) {
    return {
      allowed: false,
      reason: "Gift suggestions are reserved for verified recovery or loyalty moments.",
    };
  }

  return {
    allowed: true,
    reason: "Gift can be suggested as recovery care, not in exchange for a positive review.",
  };
}

function approvalRequired(actionType, review) {
  if (actionType === "public_reply" && isAtRisk(review)) return true;
  if (actionType === "gift") return true;
  if (actionType === "recovery_call") return true;
  return false;
}

module.exports = {
  canSendReviewRequest,
  canSuggestGift,
  approvalRequired,
  hasConsent,
  hasOpenIssue,
  isPromoter,
  isAtRisk,
};
