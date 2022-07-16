export function assert(bool) {
    if(!bool) throw Error("Assertion failed.");
}