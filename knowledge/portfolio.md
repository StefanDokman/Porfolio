---
title: Stefan Dokman – Portfolio
---

# Stefan Dokman – Game Developer portfolio

Source: https://portfolio.stefandokman.com. This file restates everything shown on the portfolio site as plain text. The site has four tabs: Neuroblast, Code Havoc, Web Games and Earlier Projects.

## Summary

Stefan Dokman is a game developer: a Unity gameplay developer with 4 years of experience shipping mobile games, with strong shader and rendering skills for low-end Android devices. Stefan also builds multiplayer web games with PixiJS on Cloudflare Workers.

- Current role: Unity Developer at Neuroblast, August 2025 – present.
- Previous role: Unity Developer at Code Havoc, 2022 – 2025.
- Areas listed on the site: Unity, game development, shaders, HLSL, mobile game optimization, PixiJS, Cloudflare Workers.

## Contact and links

- Email: stefandokman@hotmail.com. The Code Havoc and Earlier Projects entries on the site each have an "Ask me about this project" link that opens an email to this address.
- LinkedIn: https://linkedin.com/in/stefandokman
- GitHub: https://github.com/StefanDokman
- CV (PDF on Google Drive): https://drive.google.com/file/d/1pq_L5-YweULOI_2ZdV7VGmYtgKnV6b6A/view?usp=sharing
- Portfolio: https://portfolio.stefandokman.com

## About Stefan

The About section of the site, restated:

- Stefan started learning programming in the second year of high school, and it wasn't long before Stefan began making games.
- Stefan's first project was a 2D platformer; looking back at it is a good reminder of how much Stefan has grown as a developer.
- Curiosity about how games work behind the scenes has always driven Stefan to keep learning.
- Stefan has been using Unity for a few years and enjoys experimenting with new concepts, features and tools.
- College deepened Stefan's understanding of algorithms, memory and core programming principles, and Stefan's passion for games has only grown stronger.
- Stefan welcomes questions about the projects, or people who just want to connect, by email or LinkedIn.

## Neuroblast · Unity Developer · August 2025 – present
<!-- link: #neuroblast -->

On the site: the Neuroblast tab (https://portfolio.stefandokman.com/#neuroblast). Company website: https://theneuroblast.com

Neuroblast makes therapeutic games for motor-skill recovery. The games are played with Neuroblast's own hardware, the Motus controller and the Aequa balance board, and are distributed through the company's own Android platform, so the portfolio can't link to the games themselves; each one links to the Neuroblast website instead.

Stefan owns games end to end at Neuroblast, from prototype to release, working closely with artists on gameplay, shaders and UI. All eight Neuroblast games below are Unity mobile games.

### Honey Road (Neuroblast)

An infinite 3D runner in which the player steers a vehicle.

- A vertex-based shader curves the entire screen for an immersive sense of depth.
- Distance-based shading creates a realistic sunset atmosphere.
- Vehicle steering uses Ackermann steering geometry for realistic handling.
- A custom lighting model reduces shader overhead.
- Dithering-based transparency.
- Extensive object pooling.
- Self-developed animations.

### World Traveler (Neuroblast)

A city car driving game.

- Extensive LOD optimization, including custom LOD solutions.
- A highly configurable vehicle controller.
- A custom lighting model to reduce shader overhead.
- Dithering-based transparency.
- Extensive object pooling to minimize runtime allocations and instantiation overhead.
- A custom camera rig with a handmade speculative collision detection system.

### Turtle Quest (Neuroblast)

A 2D infinite runner.

- Parallax background.
- A custom vertex-based shader for 2D water waves.
- Object pooling to reduce runtime instantiation overhead.
- Configurable gameplay settings.

### Gear Up (Neuroblast)

A vertical mobile jumping game.

- Object pooling.
- Custom animations driven by Bézier curves.
- A UI height meter synchronized with gameplay progression.
- Configurable gameplay settings.

### Fluffy Rush (Neuroblast)

A dinosaur-style infinite runner inspired by the offline Chrome Dino game.

- Configurable gameplay parameters.
- Animations driven by Unity's Animator.
- Custom physics for jumping and hit reactions.

### Space Scout (Neuroblast)

A 2D space-themed infinite runner about dodging asteroids and planets.

- Object pooling for efficient runtime performance.
- Gameplay modifiers that add variety to each run.

### Pick It Up (Neuroblast)

An exercise-style game about placing objects on shelves.

- Built around a ScriptableObject-driven architecture, which makes it easy to add and configure new themes, styles and content.

### Fairy (Neuroblast)

A balancing game where the player must stay centered on screen.

- Various particle effects.
- A UI progress meter.
- A unified mathematical model that governs the gameplay mechanics.

## Code Havoc · Unity Developer · 2022 – 2025
<!-- link: #code-havoc -->

On the site: the Code Havoc tab (https://portfolio.stefandokman.com/#code-havoc).

At Code Havoc, Stefan worked on outsourced mobile games for external clients. These games shipped to Android with more than 200,000 combined downloads. Stefan built core gameplay, UI and game logic, handled device-specific bugs and performance across a wide range of Android hardware, and integrated ads, audio and VFX. Stefan also built features for and maintained Zero Tenacity, a client website in WordPress and PHP.

The titles are under NDA. The portfolio therefore uses descriptive names instead of the real game titles, shows gameplay videos for every game except Golf, and does not name the clients. Two of these games, Match 3 and Brick Breaker, were later rebuilt from scratch as personal projects so the code can be shown outside the NDA (see Earlier Projects). All eight games below are Unity mobile games.

The Code Havoc tab also lists one web project, Zero Tenacity, which is not under NDA and is shown first on the tab.

### Zero Tenacity (Code Havoc, website)

- Website: https://www.zerotenacity.com/
- Tech: WordPress, PHP.

A website for an external client, built on WordPress, which Stefan maintained for six months.

- Where existing plugins didn't cover what the client needed, Stefan wrote custom WordPress plugins in PHP, so new features live in their own plugins rather than in the theme and keep working through theme changes and updates.
- Implemented the site's e-commerce page, where visitors browse and buy products.
- Connected the site to several external APIs so it could exchange data with outside services.
- Ongoing maintenance covered fixing issues as they came up, keeping WordPress and its plugins up to date, and making the content and feature changes the client asked for.

### Golf (Code Havoc, descriptive name)

A mobile golf game for Android built on Unity's PhysX physics.

- Ball flight, bounces and rolling are driven by tuned rigidbody physics.
- A simple camera rig follows the ball automatically and hands control to the player at key moments, letting the player pan and move around the course to line up shots.
- Touch-based aiming and shot power controls.

### Match 3 (Code Havoc, descriptive name)

A mobile match-3 puzzle game.

- Swap-based matching, chain-reaction cascades and smooth timed board animations.
- Semi-procedural levels: each level's special blocks are hand-placed and stay the same on every play, while the standard pieces are generated fresh each time, so levels keep their designed challenge but never play out identically.
- Configurable levels and gameplay settings.

### Brick Breaker (Code Havoc, descriptive name)

A mobile brick breaker.

- Custom ball physics with angle-based paddle control.
- Grid-based levels stored as data, so new layouts can be added without code changes.
- Configurable gameplay settings.

### Runner (Code Havoc, descriptive name)

A mobile level-based runner with an unlimited number of levels.

- Each level is a finite run with a clear finish line, semi-randomly generated from designed segments, so every new level feels fresh while staying fair.
- Heavy ad integration: rewarded ads for revives and bonuses, interstitials between runs, and banner placements, all built into the gameplay loop without breaking its flow.

### Traffic Puzzle (Code Havoc, descriptive name)

A mobile traffic puzzle game: every car is marked with an arrow showing the way it will drive (straight, left turn, right turn or U-turn), and players tap cars in the right order to clear them all off the city streets.

- Path-based car movement through intersections and turns.
- Collision handling that stops a blocked car and costs extra moves.
- A move limit per level.
- Coin rewards for each car that escapes.
- A range of puzzle levels.
- Configurable gameplay settings.

### Block Puzzle (Code Havoc, descriptive name)

A mobile block puzzle game in the style of Block Blast: players drag sets of shaped pieces onto a grid and clear full rows and columns.

- Grid-based placement validation.
- Combo and streak scoring.
- Game-over detection when no remaining piece can fit.
- Configurable gameplay settings.

### Backgammon (Code Havoc, descriptive name)

A mobile version of the classic board game Backgammon.

- A full rules engine for legal move generation, hitting, bearing off and doubles.
- Animated dice rolls and checker movement.
- Touch controls with move highlighting.
- Configurable gameplay settings.

### Marble Shooter (Code Havoc, descriptive name)

A mobile marble shooter where a chain of colored marbles rolls along a spiral track, and the player fires marbles from a rotating shooter in the center to match three or more of the same color.

- Chain movement along a predefined path with evenly spaced marbles.
- Fired marbles are inserted into the chain at the point of impact.
- Gap closing pulls separated segments back together and triggers chain-reaction matches.
- A dotted aim line with a preview of the next marble.
- Combo scoring.

## Web Games (multiplayer, PixiJS + Cloudflare Workers)
<!-- link: #online-games -->

On the site: the Web Games tab (https://portfolio.stefandokman.com/#online-games).

Three multiplayer card games and a single-player slot game, all playable in a browser. The three card games share the same architecture: a PixiJS client and a server-authoritative backend on Cloudflare Workers. Every room or table is a Durable Object that runs the full rules engine, turn timers run on server alarms, and the rules are covered by unit tests plus fuzzed or randomized full games. The slot game runs on the same stack: every spin is resolved on the server, and each player's play-money balance is its own Durable Object.

### Flip 7 (web game)

- Play it: https://flip7.stefandokman.com
- Tech: TypeScript, PixiJS, Cloudflare Workers.

A multiplayer web version of the Flip 7 card game.

- Each room is its own Durable Object that owns the deck and the full rules engine, so clients only send intents (hit, stay, flip, give a card) and never see the draw order.
- State is saved after every action, and idle rooms hibernate through the WebSocket Hibernation API, so a game survives refreshes and lost connections without using any server time while nobody is playing.
- Turn timers, and a silent removal countdown for players who drop out, run on server alarms, which keeps the table moving.
- Testing: unit tests plus 400 fuzzed full games that check no card is ever lost or duplicated.

### Hold'em (web game)

- Play it: https://holdem.stefandokman.com
- Tech: JavaScript, PixiJS, Cloudflare Workers.

Online Texas Hold'em for up to 10 players.

- Each table is a Durable Object that runs the full rules engine (raises, side pots, all-in runouts, split pots) and sends each player a view with only their own hole cards.
- The host sets the starting chips, the starting blinds, and the level where the blinds stop doubling.
- Turn timers run on server alarms: a player who disconnects is checked or folded automatically, and is removed if still gone when it is their turn to act in the next hand.
- Testing: unit tests plus 500 random full games that check no chips are ever created or lost.

### Blackjack (web game)

- Play it: https://blackjack.stefandokman.com
- Tech: JavaScript, PixiJS, Cloudflare Workers.

Online multiplayer blackjack for up to 7 players against the dealer.

- Each table is a Durable Object that runs the full rules engine: a 6-deck shoe with a cut card, a dealer who peeks for blackjack and stands on all 17s, naturals paying 3:2, doubling, and splitting up to four hands, with one card each on split aces.
- Players join by invite link, and anyone joining a full table watches until a seat opens.
- Each hand has a turn timer that stands automatically when it runs out.
- A player who disconnects keeps their seat for the rest of the round and is removed if not back by the next one.
- The host can fill empty seats with bots that play basic strategy.
- Testing: unit tests plus 500 random full rounds at a table of seven bots.

### Forest Feast (web game)

- Play it: https://slots.stefandokman.com/
- Tech: TypeScript, PixiJS, Cloudflare Workers.

A single-player 5x3 cascading video slot with a picnic theme, played with play money only: no real money and no purchases.

- The math engine is a TypeScript port of an open-source Python slot simulator (walidelkersh/slot-simulation-engine). It runs inside a Cloudflare Worker, so every round is resolved on the server with a cryptographically secure RNG.
- Each player's play-money balance is its own Durable Object (SQLite storage), keyed by an anonymous cookie. Players start with 1,000 free credits and can refill for free.
- The server returns the whole round as data (the initial grid, every cascade step, every free spin and Hold & Spin respin), and the PixiJS client only animates it, so the client cannot change an outcome.
- 20 paylines with cascades: winning symbols burst and new ones tumble in, up to 15 times per spin. Wild chilis substitute for the paying symbols.
- Three or more bonus cauldrons anywhere award 10 free spins with every win doubled, and three more during free spins add another 10.
- Six or more cookies start Hold & Spin: cookies stick, the 3 respins reset on every new cookie, cookies carry cash values or the Mini, Minor or Major jackpot, and filling all 15 cells pays the Grand.
- Testing: unit tests ported from the original Python suite plus checks on every cascade step, and a Monte Carlo run of 10 million spins puts the return to player at about 96%.

## Earlier Projects (Unity, HLSL)
<!-- link: #personal-projects -->

On the site: the Earlier Projects tab (https://portfolio.stefandokman.com/#personal-projects).

Personal projects, each shown with a gameplay video. They have no public download links; visitors can email Stefan to ask about any of them.

### First Person Shooter (earlier project, Unity)

- Built on a custom kinematic movement controller instead of Rigidbody physics, giving frame-consistent acceleration and air control.
- Weapons and enemies are fully data-driven through ScriptableObjects. Fire mode (full-auto or semi-auto), fire rate and a procedural recoil curve are defined per weapon asset, and enemy stats and collision behaviour per enemy asset, so new variants are added without touching code.

### Match 3 (earlier project, Unity)

A from-scratch personal rebuild of the match-3 game Stefan developed at Code Havoc, made so the code can be shown outside the NDA.

- The board's logical state is kept separate from its presentation.
- Each move resolves as a sequence of phases: swap, match detection, clear, gravity, refill, cascade check.
- A timer-driven sequencer gates input until the animations finish, so the visuals can't drift out of sync with the board.
- Cascades are handled by re-running match detection after every refill until the board is stable.

### Endless Runner (earlier project, Unity)

- Deterministic, position-based gameplay with no physics engine.
- A custom toon shader with screen-wide vertex distortion curves the entire world, so all gameplay stays in straight lines while the curvature is purely visual.
- The same shader handles stylised lighting and outlines in a single pass to keep GPU overhead low.
- Track segments and obstacles are fully object-pooled to avoid runtime allocations and instantiation spikes, and are spawned by a sliding-window algorithm.
- Character states are driven by Unity's Animator.

### Platformer 3D (earlier project, Unity)

- A hybrid approach to physics: custom movement and jump integration for tight, tunable control, while Unity's collision detection resolves contacts with terrain and hazards.
- Moving platforms carry the player by passing on their velocity.
- Static level geometry uses baked lightmaps, with light probes lighting the player and moving elements, which keeps real-time lighting cost low.

### Twin Stick Shooter (earlier project, Unity)

A 2D tank shooter.

- Tank-style controls: rotate in place, drive forward or back.
- A time-slow ability driven by a custom time system built on unscaled delta time, instead of changing the global Time.timeScale.
- Enemies spawn on a ring just outside the camera's bounds, computed from the viewport, so they never appear on screen.
- Enemies and projectiles are object-pooled to avoid runtime allocations.

### Brick Breaker (earlier project, Unity)

A from-scratch personal rebuild of the brick breaker Stefan developed at Code Havoc, made so the code can be shown outside the NDA.

- Skips the physics engine: ball movement, collision and reflection are handled with Stefan's own vector and trigonometry math.
- The ball's bounce angle off the paddle depends on where it hits, which gives the player aim control.
- Owning the collision step makes the game's behaviour deterministic and fully tunable.

### Texture Erosion Shader (earlier project, HLSL)

A dissolve/erosion shader written in HLSL for dissolving cards and VFX.

- A noise mask combined with a UV-space direction bias decides the order in which pixels erode.
- A single reveal parameter drives the effect from 0 to 1, so it can be animated from code or a Timeline.
- A feather parameter controls the width of the two-colour burn edge.
- It uses one texture sample and a few ALU ops, so it's cheap enough to run on many objects at once.

## Skills shown across the projects

An index for questions like "has Stefan worked with X?". Each item names the projects where it appears.

- Shaders and rendering: vertex shaders that curve the screen or world (Honey Road, Endless Runner); a vertex shader for 2D water waves (Turtle Quest); custom lighting models to reduce shader overhead (Honey Road, World Traveler); dithering-based transparency (Honey Road, World Traveler); distance-based sunset shading (Honey Road); a single-pass toon shader with stylised lighting and outlines (Endless Runner); an HLSL dissolve shader (Texture Erosion Shader); baked lightmaps and light probes (Platformer 3D).
- Performance and optimization: object pooling (Honey Road, World Traveler, Turtle Quest, Gear Up, Space Scout, Endless Runner, Twin Stick Shooter); custom LOD solutions (World Traveler); performance and device-specific bugs across a wide range of Android hardware (Code Havoc).
- Physics and movement: Ackermann steering geometry (Honey Road); a configurable vehicle controller (World Traveler); tuned PhysX rigidbody ball physics (Golf); custom physics instead of the physics engine (Brick Breaker rebuild, Endless Runner, Fluffy Rush's jumping and hit reactions); a kinematic character controller (First Person Shooter); custom movement combined with Unity collision detection (Platformer 3D).
- Cameras: a camera rig with handmade speculative collision detection (World Traveler); a ball-following camera that hands control to the player (Golf).
- Architecture and data-driven design: ScriptableObject-driven content (Pick It Up, First Person Shooter); levels stored as data (Brick Breaker at Code Havoc); board logic separated from presentation with a phase-based sequencer (Match 3 rebuild); full rules engines (Backgammon, Flip 7, Hold'em, Blackjack); semi-procedural level generation (Match 3 and Runner at Code Havoc).
- Animation, UI and effects: Bézier-curve animations and a UI height meter (Gear Up); Unity Animator (Fluffy Rush, Endless Runner); particle effects and a UI progress meter (Fairy); touch controls (Golf, Traffic Puzzle, Block Puzzle, Backgammon).
- Monetization: rewarded, interstitial and banner ads built into the gameplay loop (Runner); ads, audio and VFX integration (Code Havoc).
- Multiplayer and backend: server-authoritative multiplayer on Cloudflare Workers with Durable Objects, WebSockets and the WebSocket Hibernation API, server alarms for turn timers, hidden information so players see only their own cards, disconnect and reconnect handling, invite links, and basic-strategy bots (Web Games).
- Testing: unit tests plus fuzzed or randomized full-game runs (Flip 7, Hold'em, Blackjack).
- Languages and tools named on the site: Unity, HLSL, TypeScript, JavaScript, PixiJS, Cloudflare Workers.
