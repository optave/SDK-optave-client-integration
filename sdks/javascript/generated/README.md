# Generated Artifacts

This folder is intended to hold generated outputs derived from `specs/asyncapi.yaml`.

Currently included:
- `types.d.ts` – TypeScript definitions for core payload / envelope / response schemas and helper types.
- `validators.js` – Precompiled Ajv validators for selected schemas.
- `validators.d.ts` – Type declarations for the validator functions.
- (Optional) JSON copy of the spec produced via `npm run spec:generate:json` (placed in `.asyncapi-docs/`).

Do NOT manually edit generated files; re-run the generation scripts instead.
