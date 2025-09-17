import type { NextConfig } from "next";
import MiniCssExtractPlugin from "next/dist/compiled/mini-css-extract-plugin";

const nextConfig: NextConfig = {
  webpack(config, { dev }) {
    if (dev) return config;

    const hasPlugin = Array.isArray(config.plugins)
      && config.plugins.some(
        (plugin) => plugin
          && (plugin.constructor?.name === "MiniCssExtractPlugin" || (plugin as { __ensuredByUser?: boolean }).__ensuredByUser)
      );

    if (!hasPlugin) {
      const plugin = new MiniCssExtractPlugin();
      (plugin as { __ensuredByUser?: boolean }).__ensuredByUser = true;
      config.plugins = [...(config.plugins ?? []), plugin];
    }

    return config;
  },
};

export default nextConfig;
