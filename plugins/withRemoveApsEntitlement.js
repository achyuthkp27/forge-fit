const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Custom plugin to remove aps-environment entitlement.
 * This allows expo-notifications to work for LOCAL notifications
 * without requiring a paid Apple Developer account.
 */
const withRemoveApsEntitlement = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    // Remove the aps-environment key that expo-notifications injects
    delete mod.modResults['aps-environment'];
    return mod;
  });
};

module.exports = withRemoveApsEntitlement;
