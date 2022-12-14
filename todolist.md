vv START HERE vv

<!-- ~~- redo undo -> either in stores / or through some kind of command system~~ -->
<!-- ~~- prevent cards from being outside of window, inaccesible, softlocked   OR   have a close all window button?~~ -->
<!-- ~~ sprite icons (easy peasy) ~~ -->
<!-- ~~- listener/event type system~~ -->
  <!-- ~~- update sprite icons (resources, sprite list in room editor) when sprite change~~ -->
  <!-- ~~- update sprite list when sprite is added~~ -->
  <!-- ~~- redraw room when sprite changes~~ -->
<!-- ~~- deletion of a resource -> how does it affect resources that reference it?~~ -->
<!-- ~~- resource cache -> easy access~~ -->
<!-- ~~ room editor grid + placement etc ~~ -->
<!-- ~~- calculate bounding boxes from transparency~~ -->
<!-- ~~- kb shortcut -> ctrl-s~~ -->
- [B] tutorial page
  - resizing windows
  - sprites
  - rooms
  - play
  - scripts / anims
<!-- ~~- rename Card to Window? -> wont fix~~ -->
<!-- ~~- horizontal flex window management (bitsy style)~~ -->
- mobile sprite editor support?
<!-- ~~- make drop down menu different (relative to resource, not mouse cursor; not cropped by scroll area)~~ -->
- redo undo -> either in stores / or through some kind of command system
- Clamp cards to the main area on bottom and right
<!-- ~~- scripting support and run game button~~ -->
- link to sprites/scripts on disk (offline version)
<!-- ~~sprite upload~~ -->
<!-- ~~- room editor toolbar!~~ -->
- room editor middle click -> pick
<!-- ~~- [B] (bug) save should preserve component state.~~ -->
- sprite sheet support (there is a build in pixi packer, i think?)
- alternative resources -> shapes, text
- delta time
<!-- ~~- export game data (json)~~ -->
<!-- ~~- room editor persistent data -> grid & snap settings~~ -->
<!-- ~~- multiple projects? -> export/import/project-select or bitsy-style ?~~ -->
<!-- ~~- export game (html)~~ -->
<!-- ~~- prevent ofuscation of save-critical class names like "Sprite", "Room", etc.~~ -->
<!-- ~~- room change should change game size in browser (pixi resize vs. svelte size code)~~ -->
- indexed db -> some kind of game id (also useful for file protocol stuff -> all html files share the same indexed db!!!)
<!-- ~~- [B] ability to name game (changes title in export too)~~ -->
<!-- ~~- corrupt save data? -> ability to delete data if game doesn't load after X seconds~~ -->
<!-- ~~- [B] cards should have default size & not reset on load (implementation overlap)~~ -->
<!-- ~~- [B] game does not work when ?editor / get rid of ?editor?game~~ -->
<!-- ~~- [B] scrollbar arrows are excluded from build (only affects chrome)~~ -->
- export game in dev mode -> wont fix?
<!-- ~~- differentiate "export game" and "export game data"~~ -->
<!-- ~~- [B] evaluate app from perspective of "user does not know how to resize windows"~~ -->
<!-- ~~- proper window resize bars (resize handle on all borders and corners)~~ -->
<!-- ~~- [B] clean up main toolbar, "new sprite" button!~~ -->
- (Chrome) reload button does not work in file:// protocol  -> something something same-origin
<!-- ~~- do something with "open resources maximized"~~ -->
<!-- ~~- [B] Licensing: Include p5js with proper license, log license in console, reference it in engine. WONTFIX -> no p5js~~ -->
<!-- ~~- [B] sprite icon not reactive~~ -->
<!-- ~~- game window size -> set iframe default size to size of start room (opening game window jank)~~ -->
<!-- ~~- room editor drag to draw/delete~~ -->
- tidy up the projects folder structure, etc.
- [B] auto save/load (+refactor? vvv)
<!-- ~~- sprite resize bug introduced by fixing "drag sprite out of window" bug. T_T~~ -->
- Refactor save data -> no complicated tree, more readable?
<!-- ~~- [B] dont' clutter index db without reason~~ -->
- [B] how are people going to make even a simple game? -> behaviour blocks
<!-- ~~- [B] Redo pop ups (modals) to actually block stuff and cover whole screen~~ -->
- Resources card should have larger default width
- Change image save format -> paletted
<!-- ~~- [B] simple scripting doc -> can be opened next to scripting window~~ -->
<!-- ~~- Sprite editor tabs dont look right~~ -->
<!-- ~~- Clean out old files (static files)~~ -->
<!-- ~~- "custom properties" table in sprite (to work with the closure system)~~ -->
- Ability to delete save files, lol. Also add dates to saves, lol
- [B] Example/Skeleton project
- use an about:blank iframe and fill it manually -> not relying on active internet connection
- [B] [test] Pixel perfect canvasses -> round to nearest multiple, instead of defaulting to fixed ratio
- Support TouchEvents
- Game iframe fullscreen button
- Shorter uuids
- General way to show errors to the user
- pop out script editors
- event system
  - after create / first update (runs at first update)
  - draw
- revamp scripting system -> isolate components? less code gen? how to do props?
- instance order menu
- more stores, less `let blabla = external.prop; $: external.prop = blabla;`
- make more cards have initial widths (like the sprite editor)
- Get rid of instance.ts, since it's only used in the room editor
- room editor toolbar!
  - drag view (how to do view lol)
  - multi-tool
  - delete
  - place (multiple)
- web gl renderer
- animation in sprite editor
<!-- ~~- type system (e.g. wall-type, enemy-type, etc.) or equivalent~~ -->
- revisit save/load -> delete saves, think about it some more?
- expose error messages
  - general errors
  - syntax error (in scripts)
  - runtime errors (game)
- corrupt save data? -> ability to delete data if game doesn't load after X seconds
- redesign resource window (no contex menu? -> buttons?), make it easier to make sprite and stuff
<!-- ~~- make resources use a _map_ and shorter ids/symbols~~ -->
- make resources use shorter ids/symbols (?)
- proper scripting reference
<!-- ~~- "are you sure you want to leave" thingy~~ -->
- replace resourceManager with WeakMap
- allow behaviours on rooms
- img icon in title of sprite cards
- props in behaviour preview
- props need a scollbar if there are a lot of them lol
- resource stores -> do actually signal destruction, use this to close windows (e.h. behaviours)
- general breaking bugs related to deleted resources]
- improve license info -> it should be a list, that users add to
- unlink the renderer / clean up webgl

Useful for metroidvania: 
<!-- ~~- reusable behaviours (behaviour as resource)~~ -->
 - rotating ~~and scaling~~ sprites
 - world map room arrangement
 - destroy event
 - animation

MTV TDL:
 - restart button & cheats
 - remix behaviour, saves, etc. (including url param bugs, index db key sharing, "initial save" state, etc.)
 - sound lol
<!-- ~~ - popup window with disclaimer~~ -->
<!-- ~~ - licensing?~~ -->

Triage, last day:
   I D
 <!-- - 0 0   item pick up text / sfx -->
 <!-- - 0 0    fix disclaimer after save -->
 <!-- - 3 1  3.0  blue boss timer / start -->
 <!-- - 3 1  3.0  that one spike pit? -->
 <!-- - 5 2  2.5  hat sprite!! -->
 <!-- - 5 2  2.5  game title -->
 <!-- - 9 4  2.2  ending -->
 <!-- - 5 3  1.6  double-check remix game view etc. -->
 <!-- - 6 4  1.5  cheats and restart -->
 <!-- - 4 2  2.0  green guys -->
 <!-- - 6 4  1.5  error messages ingame -->
 <!-- - 5 5  1.0  story -->
 - 5 5  1.0  fill empty rooms
 - 2 2  1.0  2nd boss death anim
 - 3 3  1.0  some dmg up
 - 3 5  0.6  cover art
 - 1 8  0.1  music?

Popup quickstart:
 - you can save&load different versions of this game using the save and load buttons
 - (these are stored in your browser, specifically your indexed db storage)
 - you can return to the original game, by deleting all save data in the settings menu
 - alternatively you can create a save right now, to have a copy of the original state!
 - you can (and should) keep backups of the data using the export button
 - be careful with big images! The engine was tested on sprites in the 60-120 pixel range, high-res images might break the engine.
 - Bugs, questions, feature requests: Please message me on itch or mastodon!


blockers:
- tests (?)
- bugs

ONBOARDING:
1. where do I click? -> not obvious, that you would click on the sprites folder at all
2. Now I have to open the sprite? -> Not super obvious
3. (I have to name it now -> meh?)
4. Drawing is pretty intuitive
5. (BUT: How do I zoom? D:<)
6. Room Editor

Possible first user actions:
- try out all the top buttons
  - open game before anything exists
- click on folder
  - create sprite
  - create room

Solution for a lot of this: 
- Start with an example/skeleton project

PORT STUFF
~~- draggable loic in Card~~
~~- save and loa~~
- rest of the CSS



EDITOR TIPS



IDEA PILE
- did you know... type window with random tips
- default main menu


LIB FUNCTIONS:
- collision
  - at point
  - at place
  - line
  - circle
  - rectangle
- move
  - bounce
  - slide
- general
  - destroy
  - spawn
- flow
  - restart room
  - next room
  - go to room
  - restart game
- 