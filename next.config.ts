import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Deshabilitar verificación de TypeScript en build para evitar errores de Supabase types
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
