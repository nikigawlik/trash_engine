export function assert(bool: boolean) {
    if(!bool) throw Error("Assertion failed.");
}

export function adjustedCanvasSize(size: number): number {
    // 1px == devicePixelRatio physical pixels
    const scaleFactor = Math.max(Math.round(devicePixelRatio), 1);
    size = size / window.devicePixelRatio * scaleFactor; 
    return size;
}

/**
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {boolean}
 */
 export function rectIntersect(rect1: DOMRect, rect2: DOMRect) {
    // let rect1 = document.body.getBoundingClientRect()
    // let rect2 = document.body.getBoundingClientRect()
    return rect1.left < rect2.right && rect1.right > rect2.left &&
        rect1.bottom > rect2.top && rect1.top < rect2.bottom;
}

/**
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {boolean}
 */
export function rectInside(rect: DOMRect, bounds: DOMRect) {
    const result = rect.right <= bounds.right && rect.left >= bounds.left && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
    // let rp = rect => `[${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}]`;
    // console.log(`is ${rp(rect)} in ${rp(bounds)}? ${result? "yes" : "no"}.`)
    return result;
}

export function parseIntSafe(string: string, minValue = -Infinity) {
    let intValue = parseInt(string);
    if(isNaN(intValue)) intValue = 0;
    return Math.max(minValue, intValue);
}

export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

let randState = 1;

export function xorshiftSetSeed(seed: number|string) {
    if(typeof seed == "number") {
        randState = ~~seed;
    } else {
        let hash = 0;
        if (seed.length === 0) return hash;
        for (let i = 0; i < seed.length; i++) {
            let chr = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        randState = hash;
    }
    if(randState == 0) randState = 1; // 0 is no bueno

    console.log(`set seed: ${seed} => ${randState}`);
}

/**
 * @returns A pseudo-random 32 bit signed integer value
 */
export function xorshiftGetRandom()
{
	/* Algorithm "xor" from p. 4 of Marsaglia, "Xorshift RNGs" */
	let x = randState;
	x ^= x << 13;
	x ^= x >> 17;
	x ^= x << 5;
	return randState = x;
}

/**
 * @returns A pseudo-random 32 float value between 0 (inclusive) and 1 (exclusive)
 */
export function xorshiftGetRandom01() {
    return (-(1<<31) + xorshiftGetRandom()) / (2**32);
}

export interface Color {
    r: number,
    g: number,
    b: number,
    a: number;
}

/**
 * 
 * @param r red component, between 0 and 1
 * @param g green component, between 0 and 1
 * @param b blue component, between 0 and 1
 * @param a alpha component, between 0 and 1
 * @returns color
 */
export function getColorRGBA(r: number, g: number, b: number, a: number = 1): Color {
    return { r, g, b, a }
}

/**
 * 
 * @param h hue, between 0 and 2*PI
 * @param s saturation, between 0 and 1
 * @param v value, between 0 and 1
 * @param a alpha, between 0 and 1
 * @returns color
 */
export function getColorHSVA(h: number, s: number, v: number, a: number = 1): Color {
    h = mod(h, Math.PI * 2);
    const c = v * s
    const x = c * (1 - Math.abs((h / (Math.PI / 3)) % 2 - 1));
    const m = v - c;
    const sextant = h / (Math.PI / 3);
    const [_r, _g, _b] = 
        sextant < 1? [c, x, 0] :
        sextant < 2? [x, c, 0] :
        sextant < 3? [0, c, x] :
        sextant < 4? [0, x, c] :
        sextant < 5? [x, 0, c] :
                     [c, 0, x]
    ;
    return { 
        r: _r + m,
        g: _g + m,
        b: _b + m,
        a,
    };
}

