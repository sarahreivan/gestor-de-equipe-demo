# Project conventions
- Treat database DATE fields as unchanged YYYY-MM-DD strings in forms and payloads; use src/lib/dates.ts for local parsing, display, and calendar-day arithmetic to avoid timezone and daylight-saving shifts.
- Keep vacation calendar span/lane allocation in a pure presentation helper and the month grid in a reusable component so visual changes never alter stored periods or filtering rules.
- Keep login field validation in a browser-safe pure helper; display field errors without changing the Supabase authentication provider.
- Scope login palette overrides to the login screen so exact login colors never recolor authenticated screens.
- Generate dashboard files from its already-filtered display arrays in a browser-safe export module; precompute Excel before download clicks to preserve mobile user activation.