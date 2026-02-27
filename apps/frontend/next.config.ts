import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // async rewrites() {
    //     return [
    //         {
    //             source: '/api/:path*', // フロントがこのパスにアクセスしたら
    //             destination: 'http://localhost:3001/api/:path*', // バックエンドのローカルURLに転送する
    //         },
    //     ];
    // },
    trailingSlash: true,
};

export default nextConfig;
