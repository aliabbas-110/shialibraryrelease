// Configuration for books/chapters with restricted functionality
// Add book IDs and chapter IDs that should have copy/paste disabled

export const RESTRICTED_CONTENT = {
  // Book IDs with full restriction (no copy/paste/save)
  restrictedBooks: [5, 6], // Add your specific book IDs here
  
  // Chapter IDs with restriction (for specific chapters only)
  restrictedChapters: [], // Add your specific chapter IDs here
  
  // Book IDs where saving is allowed but copy/paste is restricted
  copyRestrictedOnly: [],
  
  // Enable/disable features globally
  features: {
    allowCopy: true,
    allowSave: true,
    allowPrint: false,
  }
};

// Helper function to check if content is restricted
export const isContentRestricted = (bookId, chapterId = null) => {
  const parsedBookId = parseInt(bookId);
  const parsedChapterId = chapterId ? parseInt(chapterId) : null;
  
  // Check if book is fully restricted
  if (RESTRICTED_CONTENT.restrictedBooks.includes(parsedBookId)) {
    return {
      allowCopy: false,
      allowSave: false,
      allowFeedback: false,
      isRestricted: true
    };
  }
  
  // Check if chapter is restricted
  if (parsedChapterId && RESTRICTED_CONTENT.restrictedChapters.includes(parsedChapterId)) {
    return {
      allowCopy: false,
      allowSave: false,
      allowFeedback: false,
      isRestricted: true
    };
  }
  
  // Check if copy only is restricted for this book
  if (RESTRICTED_CONTENT.copyRestrictedOnly.includes(parsedBookId)) {
    return {
      allowCopy: false,
      allowSave: true,
      allowFeedback: true,
      isRestricted: true
    };
  }
  
  // Default: all features allowed
  return {
    allowCopy: RESTRICTED_CONTENT.features.allowCopy,
    allowSave: RESTRICTED_CONTENT.features.allowSave,
    allowFeedback: true,
    isRestricted: false
  };
};

// Helper to get restriction badge text
export const getRestrictionBadgeText = (restrictions) => {
  if (!restrictions.allowCopy && !restrictions.allowSave) {
    return "Protected Content";
  }
  if (!restrictions.allowCopy) {
    return "Copy Restricted";
  }
  return null;
};