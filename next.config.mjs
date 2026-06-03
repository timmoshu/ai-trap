/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static-first: pages are statically generated. We deliberately do NOT use
  // `output: 'export'` so the single OG-image route (Phase B) can run on Vercel.
};

export default nextConfig;
