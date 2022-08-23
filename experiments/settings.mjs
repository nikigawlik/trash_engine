// TODO move to game!

export let settings = {
    canvas: {
        width: 256,
        height: 256,
        color: "#eee",
    },
    images: [
        {
            name: "tileset",
            // filename: "CGA8x8thick.png",
            filename: "LN_EGA8x8.png",
            slice: {
                columns: 16,
                rows: 16,
            },
            charmap: 
                "␀☺☻♥♦♣♠•◘○◙♂♀♪♫☼" +
                "►◄↕‼¶§▬↨↑↓→←∟↔▲▼" +
                " !\"#$%&'()*+,-./" +
                "0123456789:;<=>?" +
                "@ABCDEFGHIJKLMNO" +
                "PQRSTUVWXYZ[\\]^_" +
                "`abcdefghijklmno" +
                "pqrstuvwxyz{|}~⌂" +
                "ÇüéâäàåçêëèïîìÄÅ" +
                "ÉæÆôöòûùÿÖÜ¢£¥₧ƒ" +
                "áíóúñÑªº¿⌐¬½¼¡«»" +
                "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐" +
                "└┴┬├─┼╞╟╚╔╩╦╠═╬╧" +
                "╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
                "αßΓπΣσµτΦΘΩδ∞φε∩" +
                "≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
        },
    ]
};