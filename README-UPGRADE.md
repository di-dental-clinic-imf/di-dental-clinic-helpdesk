# DI Dental Clinic PWA — upgraded test build

This version keeps the existing Google Apps Script connection and Google Sheet workflow.

## Local test
From this folder run:

    python -m http.server 8000

Then open:

    http://localhost:8000/

## Important
PWA installation on Android requires HTTPS (localhost is mainly for development/testing).

## Changes in this build
- Added Android PWA icons.
- Added install/theme metadata.
- Improved service-worker caching and versioning.
- Added clinic image to the app shell cache.
- Added minimum date handling for date inputs.
- Added client-side Indian mobile and Patient ID validation helpers.
- Added a generic double-submit safeguard.

The Google Apps Script backend has NOT been changed in this build.


## Backend test deployment
This test build points to the new Apps Script Web App deployment.

Do not replace the production/working PWA until testing is complete.
