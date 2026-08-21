# Real Estate Signal Stack Frontend

This Vite React app is the presentation and dashboard layer for the Real Estate Signal Stack final-year project.

## Main Screens

- `/` - project introduction with 3D visual explanation
- `/admin` - passwordless Admin portal for data, API keys, and workflow tools
- `/investor-dashboard` - protected investor intelligence dashboard
- `/enterprise-workbench` - protected risk and allocation workbench
- `/data-sheet` - protected master intelligence sheet

## Model Explanation

The analysis report displays the scoring methodology returned by the backend:

```text
/api/model/methodology
/api/areas/{area_id}
```

The backend currently exposes a transparent hybrid ML scoring model with normalized inputs, feature weights, logistic risk probability, and confidence scoring metadata.

Full methodology notes are in:

```text
../docs/model-methodology.md
```

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
