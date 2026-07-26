# Yale YDM3168 Z-Wave Lock for Homey

Homey SDK v3 app for the Yale YDM3168 mortise lock with a Z-Wave module.

## Version 1.3.0

- Lock and unlock control in Homey.
- Flow triggers for keypad, thumbturn, Z-Wave, auto-lock, tamper, battery, and PIN events.
- Management of 10 Yale PIN slots through device settings.
- PIN codes from 6 to 12 digits; codes can be written, replaced, and removed.

## Notes

- Pair the lock using secure Z-Wave inclusion (Security S0 for this lock).
- PINs are stored in the Homey device settings. Keep access to Homey and its backups secure.
- Some physical actions, such as a thumbturn or fingerprint action, may not generate a Z-Wave report on this model.
