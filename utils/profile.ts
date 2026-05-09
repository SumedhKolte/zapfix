export const isFullNameMissing = (fullName?: string | null) => {
  if (!fullName) {
    return true;
  }

  const normalized = fullName.trim();
  if (!normalized) {
    return true;
  }

  return normalized.toLowerCase() === 'new user';
};
