export function assert(bool) {
    if(!bool) throw Error("Assertion failed.");
}


/**
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {boolean}
 */
 export function rectIntersect(rect1, rect2) {
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
export function rectInside(rect, bounds) {
    const result = rect.right <= bounds.right && rect.left >= bounds.left && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
    // let rp = rect => `[${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}]`;
    // console.log(`is ${rp(rect)} in ${rp(bounds)}? ${result? "yes" : "no"}.`)
    return result;
}

export function parseIntSafe(string, minValue = -Infinity) {
    let intValue = parseInt(string);
    if(isNaN(intValue)) intValue = 0;
    return Math.max(minValue, intValue);
}