// afterSign hook: notarize the signed macOS app with Apple's service.
//
// Runs automatically after electron-builder signs the .app, but ONLY when the
// notarization credentials are present in the environment — so ordinary local
// dev builds (and CI without secrets) sign and skip notarization instead of
// failing. No credentials are ever committed.
//
// To notarize, export before `npm run app:dist`:
//   APPLE_ID                    your Apple ID email
//   APPLE_APP_SPECIFIC_PASSWORD an app-specific password (appleid.apple.com)
//   APPLE_TEAM_ID               your 10-char Developer Team ID
//
// The app must be signed with a "Developer ID Application" certificate; provide
// it via the keychain or CSC_LINK / CSC_KEY_PASSWORD.

const { notarize } = require('@electron/notarize');

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.log('[notarize] Apple credentials not set — skipping notarization (signed build only).');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  console.log(`[notarize] Submitting ${appName}.app to Apple — this can take a few minutes…`);

  await notarize({
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });

  console.log(`[notarize] ${appName}.app notarized and stapled.`);
};
