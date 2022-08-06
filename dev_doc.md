# simple dev documentation

### about

this contains simple documentation details about how this web app is implemented, including recurring programming patterns, standards, etc.

### 1 - prinicples

- minimal dependencies
  - avoid dependencies or libraries
  - avoid libraries which are continuously updated (creates expectation to stay 'up to date' -> extra maintanance work)
  - if libraries are used they are copied into the lib folder, not linked in any way
  - there is _no_ mandatory build step, this app is always ready to go as is
- the app is a contiuous prototype until it reaches a usable state, only then we think about maintainability (tests etc.)

### HTML
- the structure of the app is defined in html template strings -> ````html`this is html`​````.
- input event listeners are defined after the html template strings, using `querySelector` and event listeners (oneventname style is fine)
- The html function which makes this template string is implemented in deps and usually returns an html element. It will return an array of elements if multiple top level elements exist in the template string.
- generalized small components, which are used multiple times are in `components.mjs`
- resource editors (sprite, room editor, settings etc.) are in their own module, together with the class which represents the data being edited. The html can be a separate function in the module or part of the class.