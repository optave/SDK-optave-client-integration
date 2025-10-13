# Generated Artifacts

This folder is intended to hold generated outputs derived from `specs/asyncapi.yaml`.

Currently included:
- `types.d.ts` – TypeScript definitions for core payload / envelope / response schemas and helper types.
- `validators.js` – Precompiled Ajv validators for selected schemas.
- `validators.d.ts` – Type declarations for the validator functions.
- `constants.js` – Generated constants derived from the spec.
- `connection-config.ts` – Connection configuration types and definitions.
- `index.ts` – Main entry point for generated artifacts.
- `examples/` – Generated example files for browser and server environments.
- (Optional) JSON copy of the spec produced via `npm run spec:generate:json` (placed in `.asyncapi-docs/`).

Do NOT manually edit generated files; re-run the generation scripts instead.
