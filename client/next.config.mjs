/** @type {import('next').NextConfig} */
const nextConfig = {
  functions: {
    "app/api/**/*": {
      maxDuration: 10 // All functions can run for a maximum of 10 seconds
    }
  }
};

export default nextConfig;
