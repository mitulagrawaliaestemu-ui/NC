const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const apiBaseUrl = (() => {
  const baseUrl = import.meta.env.VITE_API_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim();
  return baseUrl ? trimTrailingSlash(baseUrl) : '';
})();

export const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
};
