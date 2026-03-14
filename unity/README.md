# SP NET GAMERS v1.0.1 (Unity Prototype)

This is a playable Unity prototype for the mobile battle-royale concept.

## Requirements
- Unity 2022.3 LTS (built-in render pipeline)
- Android Build Support (if you want an APK/AAB)

## Open + Play
1. Open Unity Hub.
2. Add project: `/Users/savanpatel/Documents/SP-NET-GAMERS-Unity`.
3. Open the project (Unity may prompt to upgrade; approve).
4. Press Play in the editor. The match auto-starts in any scene.

## Controls
- Desktop: WASD / Arrow keys to move, mouse to aim, left click to shoot.
- Mobile: Left joystick to move, right joystick to aim + auto-shoot when pushed.
- Press `1/2/3` on desktop to swap weapons.
- Press `R` to restart.

## Economy + Admin (Dev Only)
- SP Gems and SP Coins are displayed on the HUD.
- Tap `Store` to open the shop and buy test items.
- Tap `Admin` to open a dev-only panel to add SP Coins/Gems for testing.
- Balances are stored locally using PlayerPrefs.

## Profile + Retention (Prototype)
- Profile panel shows name, level, XP, streak, matches, and lifetime kills.
- Daily reward grants SP Coins and SP Gems once per day (streak bonus).
- Match rewards grant XP, Coins, and Gems on win.
- Daily missions auto-progress and auto-claim on completion.
- Battle Pass XP/tier advances with match rewards.

## Cloud Save (Prototype)
- Tap `Cloud` to login or register.
- Requires the backend running on `http://localhost:8787`.
- When cloud is enabled, match rewards, daily rewards, and store purchases sync to the server.

## Build (Android)
1. File > Build Settings > Android > Switch Platform.
2. Add any open scene (empty is fine).
3. Build (APK/AAB). Keep textures/audio minimal to stay under 300MB.

## Notes
- Game name: SP NET GAMERS
- Version: v1.0.1
- All content is original and lightweight for size.
