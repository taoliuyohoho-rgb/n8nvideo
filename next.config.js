/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 启用 standalone 输出，用于 Docker/Cloud Run
  images: {
    domains: ['localhost', 'example.com'],
  },
  // 开发服务器配置 - 绑定到localhost避免权限问题
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
