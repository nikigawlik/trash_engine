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
- calculate bounding boxes from transparency
<!-- ~~- kb shortcut -> ctrl-s~~ -->
- [B] tutorial page
  - resizing windows
  - sprites
  - rooms
  - play
  - scripts / anims
<!-- ~~- rename Card to Window? -> wont fix~~ -->
- horizontal flex window management (bitsy style)
- mobile sprite editor support?
<!-- ~~- make drop down menu different (relative to resource, not mouse cursor; not cropped by scroll area)~~ -->
- redo undo -> either in stores / or through some kind of command system
- Clamp cards to the main area on bottom and right
<!-- ~~- scripting support and run game button~~ -->
- link to sprites on disk (offline version)
<!-- ~~sprite upload~~ -->
- room editor toolbar!
  - drag view (how to do view lol)
  - multi-tool
  - delete
  - place
- room editor middle click -> pick
<!-- ~~- [B] (bug) save should preserve component state.~~ -->
- sprite sheet support (there is a build in pixi packer, i think?)
- alternative resources -> shapes, text
- delta time
<!-- ~~- export game data (json)~~ -->
- room editor persistent data -> grid & snap settings
- multiple projects? -> export/import/project-select or bitsy-style ?
<!-- ~~- export game (html)~~ -->
<!-- ~~- prevent ofuscation of save-critical class names like "Sprite", "Room", etc.~~ -->
<!-- ~~- room change should change game size in browser (pixi resize vs. svelte size code)~~ -->
- indexed db -> some kind of game id (also useful for file protocol stuff -> all html files share the same indexed db!!!)
<!-- ~~- [B] ability to name game (changes title in export too)~~ -->
- corrupt save data? -> ability to delete data if game doesn't load after X seconds
<!-- ~~- [B] cards should have default size & not reset on load (implementation overlap)~~ -->
<!-- ~~- [B] game does not work when ?editor / get rid of ?editor?game~~ -->
<!-- ~~- [B] scrollbar arrows are excluded from build (only affects chrome)~~ -->
- export game in dev mode -> wont fix?
- differentiate "export game" and "export game data"
<!-- ~~- [B] evaluate app from perspective of "user does not know how to resize windows"~~ -->
<!-- ~~- proper window resize bars (resize handle on all borders and corners)~~ -->
- [B] clean up main toolbar, "new sprite" button!
- (Chrome) reload button does not work in file:// protocol  -> something something same-origin
<!-- ~~- do something with "open resources maximized"~~ -->
<!-- ~~- [B] Licensing: Include p5js with proper license, log license in console, reference it in engine. WONTFIX -> no p5js~~ -->
<!-- ~~- [B] sprite icon not reactive~~ -->
- game window size -> set iframe default size to size of start room
- room editor drag to draw/delete
- tidy up the projects folder structure, etc.
- [B] auto save/load (+refactor? vvv)
<!-- ~~- sprite resize bug introduced by fixing "drag sprite out of window" bug. T_T~~ -->
- Refactor save data -> no complicated tree, more readable?
<!-- ~~- [B] dont' clutter index db without reason~~ -->
- [B] how are people going to make even a simple game?
- [B] Redo pop ups (modals) to actually block stuff and cover whole screen
- Resources card should have larger default width
- Change image save format -> paletted
- [B] simple scripting doc -> can be opened next to scripting window
- Sprite editor tabs dont look right
- Clean out old files (static files)
- "custom properties" table in sprite (to work with the closure system)
- Ability to delete save files, lol. Also add dates to saves, lol
- [B] Example/Skeleton project
- use an about:blank iframe and fill it manually -> not relying on active internet connection
- [B] Pixel perfect canvasses -> round to nearest multiple, instead of defaulting to fixed ratio

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