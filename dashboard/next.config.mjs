/** @type {import('next').NextConfig} */
const nextConfig = {
  // oracledb is a Node-only driver: keep it out of the bundle.
  serverExternalPackages: ['oracledb'],
  reactStrictMode: true,
};
export default nextConfig;
