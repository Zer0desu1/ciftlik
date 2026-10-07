// Extends app.json. The web build is served from a sub-path on GitHub Pages
// (zer0desu1.github.io/ciftlik), so the deploy workflow sets EXPO_BASE_URL and
// every asset and route is prefixed with it. Locally it is unset and the app
// runs from the root as before.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});
