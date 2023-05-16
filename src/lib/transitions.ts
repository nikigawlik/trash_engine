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

function easeOutElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;
	
	return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
	
}

export function bounce(node, {
	delay = 0,
	duration = 400,
}) {
	// const pxstringW = getComputedStyle(node).width;
    // const w = +pxstringW.substring(0, pxstringW.length-2);
	// const pxstringH = getComputedStyle(node).width;
    // const h = +pxstringH.substring(0, pxstringH.length-2);

	// easing bounce function
	// const f = (x: number) => 0.25 ** (x*5) * x * 20 + x;
	// let f = easeOutElastic;
	const f = (x: number) => 2**(-10*x) * Math.sin(x*Math.PI*5) * .25 + 1;

	return {
		delay,
		duration,
		css: t => `transform: scale(${
			// 1 + .20 * Math.sin(t*(Math.PI*2))
			f(t)
		}, ${
			// Math.sin(1 + .20 * t*(Math.PI*2))
			f(t)
		})`
	};
}