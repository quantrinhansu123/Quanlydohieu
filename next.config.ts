import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
   images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        domains: [
            'res.cloudinary.com',
            'avatars.githubusercontent.com',
            'lfupbsuudntberju.public.blob.vercel-storage.com',
            'loremflickr.com',
            'picsum.photos',
            'cdn.jsdelivr.net',
            'lh3.googleusercontent.com',
            "placehold.co"
        ],
    },
   compiler: {
        removeConsole: process.env.NEXT_ENV === 'production',
    },
};

export default nextConfig;
