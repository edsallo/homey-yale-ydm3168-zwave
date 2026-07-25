# Yale YDM3168 Z-Wave Lock

Homey SDK v3 driver for the Yale YDM3168 mortise lock with a secure Z-Wave module.

## Features

- Lock and unlock control through the Z-Wave Door Lock command class.
- Flow triggers for keypad, thumbturn, Z-Wave, auto-lock, tamper, battery, and user-PIN events.
- Management of PIN slots 1–10 through Z-Wave User Code commands. PINs must contain 4–10 digits.

## Important notes

- Include the lock using secure Z-Wave inclusion; the driver requires secure communication.
- Some physical lock actions, such as a thumbturn or fingerprint action, may not produce a Z-Wave report on this model.
- PINs are stored in Homey device settings. The UI masks them, but treat access to Homey and its backups as sensitive.
