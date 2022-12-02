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

xorshiftSetSeed("helfasldkf");
for(let i = 0; i < 10; i++) console.log(xorshiftGetRandom())
xorshiftSetSeed("helfasldkf");
for(let i = 0; i < 10; i++) console.log(xorshiftGetRandom())
xorshiftSetSeed("helfasldkf");
for(let i = 0; i < 10; i++) console.log(xorshiftGetRandom01())
xorshiftSetSeed("helfasldkf");
for(let i = 0; i < 10; i++) console.log(xorshiftGetRandom01())