/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Enable support for file uploads by increasing body size limit
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

module.exports = nextConfig;