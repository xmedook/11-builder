/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evitar que Next.js intente hacer bundle de módulos nativos de Node.js
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
