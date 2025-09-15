// Ensure mini-css-extract-plugin is present when the loader is used
// Some environments report the plugin missing in dev for next/font CSS.
// We import Next's compiled copy to avoid adding a new dependency.
const MiniCssExtractPlugin = require('next/dist/compiled/mini-css-extract-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev }) {
    try {
      // Only ensure the plugin in production. In dev, Next uses style injection.
      if (dev) return config;

      const hasMCEP = Array.isArray(config.plugins) && config.plugins.some(
        (p) => p && (p.constructor?.name === 'MiniCssExtractPlugin' || p.__ensuredByUser)
      );
      if (!hasMCEP) {
        const plugin = new MiniCssExtractPlugin();
        // mark so we don't double-add on re-runs
        plugin.__ensuredByUser = true;
        config.plugins = config.plugins || [];
        config.plugins.push(plugin);
      }
    } catch (_) {
      // noop – keep default config
    }
    return config;
  },
};

module.exports = nextConfig;
