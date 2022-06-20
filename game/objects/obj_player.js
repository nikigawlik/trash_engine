// this code happens when the script is (re)loaded!
x = 3;
y = 1;    
done = false;


// happens when the object is created
_create = () => {
    x = 0;
    y = 0;
    t = 0;
    hp = 100;
    something = "HIHI";
    factor = Math.random() * 5
}

// happens every update (60 times a second)
_step = () => {
    x += Math.sin(t)
    y += Math.cos(t/2.232131)
    t += 1/20 * factor;
    _draw();
}

_draw = () => {
    drawTile(x, y, 64, 4, 4)
}

_log = () => {
    debugLog(`${x}, ${y}, ${hp}, ${done}`);
}

// return [_create, _step, _log];