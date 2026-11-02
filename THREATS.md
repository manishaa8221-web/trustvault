# TrustVault Threat Analysis

## Threat 1
User manipulates document URL.

Risk:
Unauthorized access to document.

Protection:
Server-side authorization checks.

## Threat 2
Access remains after permission removal.

Risk:
Old user still accesses files.

Protection:
Permission checked on every request.

## Threat 3
Direct file access.

Risk:
Bypass application.

Protection:
Files served only through backend APIs.