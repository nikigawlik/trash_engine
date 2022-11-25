export function shrink(node, {
	delay = 0,
	duration = 400,
    horizontal = true,
    vertical = false,
}) {
	const pxstringW = getComputedStyle(node).width;
    const w = +pxstringW.substring(0, pxstringW.length-2);
	const pxstringH = getComputedStyle(node).width;
    const h = +pxstringH.substring(0, pxstringH.length-2);

	return {
		delay,
		duration,
		css: t => 
            (horizontal? `width: ${t * w}px` : "") + (vertical? `height: ${t * h}px` : "") 
	};
}