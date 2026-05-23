/** True when @vercel/toolbar plugin found a linked `.vercel/project.json` at dev startup. */
export const isVercelToolbarConfigured = Boolean(
  process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_PROJECT_ID
);
