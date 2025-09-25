// UMD-specific entry point that exports constructor function directly
// This avoids webpack getter patterns that fail in Salesforce LockerService

import { OptaveJavaScriptSDK } from './main.js';
// Import crypto polyfill for side effects (sets up global crypto for UUID generation)
import '../platform/browser/crypto-polyfill.js';

// To guarantee availability on globalThis in all environments (including AMD paths),
// we perform an explicit, idempotent assignment here.
if (typeof globalThis !== 'undefined' && !globalThis.OptaveJavaScriptSDK) {
	try {
		// Direct constructor reference for single-version policy
		globalThis.OptaveJavaScriptSDK = OptaveJavaScriptSDK;
	} catch { /* noop – defensive */ }
}

// Export default for webpack UMD library.export: 'default'
// Consumers using script tags get globalThis.OptaveJavaScriptSDK; module/bundler
// users import the default export.
export default OptaveJavaScriptSDK;
