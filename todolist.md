vv START HERE vv

~~- redo undo -> either in stores / or through some kind of command system~~
~~- prevent cards from being outside of window, inaccesible, softlocked   OR   have a close all window button?~~
~~ sprite icons (easy peasy) ~~
~~- listener/event type system~~
  ~~- update sprite icons (resources, sprite list in room editor) when sprite change~~
  ~~- update sprite list when sprite is added~~
  ~~- redraw room when sprite changes~~
~~- deletion of a resource -> how does it affect resources that reference it?~~
~~- resource cache -> easy access~~
~~ room editor grid + placement etc ~~
- calculate bounding boxes from transparency
~~- kb shortcut -> ctrl-s~~
- [B] tutorial page
  - resizing windows
  - sprites
  - rooms
  - play
  - scripts / anims
~~- rename Card to Window? -> wont fix~~
- horizontal flex window management (bitsy style)
- mobile sprite editor support?
- make drop down menu different (relative to resource, not mouse cursor; not cropped by scroll area)
- redo undo -> either in stores / or through some kind of command system
- Clamp cards to the main area on bottom and right
~~- scripting support and run game button~~
- link to sprites on disk (offline version)
~~sprite upload~~
- room editor toolbar!
  - drag view (how to do view lol)
  - multi-tool
  - delete
  - place
- room editor middle click -> pick
- [B] (bug) save should preserve component state.
- sprite sheet support (there is a build in pixi packer, i think?)
- alternative resources -> shapes, text
- delta time
~~- export game data (json)~~
- room editor persistent data -> grid & snap settings
- multiple projects? -> export/import/project-select or bitsy-style ?
~~- export game (html)~~
~~- prevent ofuscation of save-critical class names like "Sprite", "Room", etc.~~
~~- room change should change game size in browser (pixi resize vs. svelte size code)~~
- indexed db -> some kind of game id (also useful for file protocol stuff -> all html files share the same indexed db!!!)
- [B] ability to name game (changes title in export too)
- corrupt save data? -> ability to delete data if game doesn't load after X seconds
- [B] cards should have default size & not reset on load (implementation overlap)
- [B] game does not work when ?editor / get rid of ?editor?game
- [B] scrollbar arrows are excluded from build (only affects chrome)
- export game in dev mode
- differentiate "export game" and "export game data"
- [B] evaluate app from perspective of "user does not know how to resize windows"
- proper window resize bars (resize handle on all borders and corners)
- [B] clean up main toolbar
- (Chrome) reload button does not work in file:// protocol  -> something something same-origin
- do something with "open resources maximized"
- [B] Licensing: Include p5js with proper license, log license in console, reference it in engine.

blockers:
- tests (?)
- bugs


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