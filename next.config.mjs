/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { serverComponentsExternalPackages: ["firebase-admin"] },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.robotis.com", pathname: "/data/**" },
      { protocol: "https", hostname: "robotis.com", pathname: "/data/**" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
