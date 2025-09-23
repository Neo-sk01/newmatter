import type { NextConfig } from "next";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const nextConfig: NextConfig = {
  webpack(config) {
    const hasMiniCssPlugin = config.plugins?.some(
      (plugin: any) => plugin instanceof MiniCssExtractPlugin
    );

    if (!hasMiniCssPlugin) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: "static/css/[name].[contenthash].css",
          chunkFilename: "static/css/[id].[contenthash].css",
        })
      );
    }

    return config;
  },
};

export default nextConfig;
