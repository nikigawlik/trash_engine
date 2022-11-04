
# Collisions

[go back to reference](reference)

---

## `place_meeting(self, x, y, sprite)`

Checks if an instance would collide with another instance ('meets it') at a specific position.

`self`:
Instance to check collision for.

`x`, `y`:
Position at which to check for collision.

`sprite`:
Sprite(s) to consider. Can be a sprite, or `all` to include all sprites. 

*returns*: Instance(s) we would collide with. Otherwise `null`.

### Examples

```
// self-destruct when hitting a wall
if(place_meeting(this, this.x, this.y, wall)) {
    destroy(this);
}

// move right, but only if there is no other instance there
if(! place_meeting(this, this.x + 10, this.y, all)) {
    x += 10;
}

// deal contact damage
let target = place_meeting(this, this.x, this.y, player);
if(target) {
    target.hp -= 5;
}

```

---

## `move_towards(self, x, y, sprite)`

Moves an instance to a position, while respecting collisions along the path. If there is a collision along the path the instance 
will stop half-way.

`self`:
Instance to move.

`x`, `y`:
Position to move to.

`sprite`:
Sprite(s) to consider. Can be a sprite, or `all` to include all sprites.

*returns*: The first instance that we meet along the way in case of a collision, otherwise null.

### Examples

```
// moves 5 pixels to the top-right, 
// but will stop at a wall along the way
move_towards(this, this.x + 5, this.y - 5, wall)

// will snap to the mouse (instantly), but only if the path is clear, 
// otherwise it will stop at the first wall on the way there.
// (Think of a 'hitscan' weapon in a 2D platformer-shooter)
let collidedInstance = move_towards(this, mouseX, mouseY, wall);
if(collidedInstance) {
    destroy(collidedInstance); // destroy the wall that was hit
}
```

---