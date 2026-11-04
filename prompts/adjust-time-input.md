# Prompt

Build only this fix: the "Starts" and "Ends" time inputs must only allow 15-minute increments (:00, :15, :30, :45). This applies to three forms:
1. Add event (and Edit event)
2. Log unplanned event
3. Add a routine (and Edit routine)

Requirements:
- In views/pages.js, replace the <input type="time"> fields for startTime and endTime (ids event-start, event-end, routine-start, routine-end) with <select> dropdowns. Don't just add step="900": browsers still let people type any minute into a time input.
- Each dropdown's first option is blank ("No time"), followed by every 15-minute time from 12:00 AM to 11:45 PM. Show them in 12-hour format (e.g., "7:15 AM") but submit them in 24-hour "HH:MM" format (e.g., "07:15"), which matches what the database already stores.
- When editing, pre-select the saved time. If an older event was saved at a time that isn't on a 15-minute mark (e.g., 07:07), show that time as a selected option labeled "(old time)" so the form doesn't silently erase it. The user must change it to a 15-minute time before saving.
- Keep the existing rule that both times are blank (untimed) or both are set with the end after the start. Keep the existing friendly error messages, and keep what the user selected after an error.
- In server.js, add server-side validation for events and routines: reject any time whose minutes aren't 00, 15, 30, or 45, with the message "Times must be on the hour or at :15, :30, or :45." Don't rely on the dropdown alone.
- The conflict warning and the "Save anyway" / "Go back" flow must keep working with the new dropdowns.
- Don't change existing events or routines in the database, and don't change any other features.
- Add automated tests: saving an event at 07:07 is rejected, saving one at 07:15 is accepted, saving one with both times blank is still accepted, and the same three cases for routines.
- Run all existing tests and make sure they still pass.

When done, create prompts/adjust-time-input.md with this prompt and a summary of what you changed. Then tell me in plain English which files changed and how a time travels from the dropdown to the database.

## Summary

Replaced event and routine start/end fields with dropdowns offering every quarter-hour value in 12-hour labels while submitting 24-hour values. Added server-side quarter-hour checks for events and routines, preserving untimed entries, selected values on errors, old saved times, and conflict choices. Added automated validation and form-rendering tests, and made no database changes.
