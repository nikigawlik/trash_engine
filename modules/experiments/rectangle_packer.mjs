/*
 * thanks to https://codeincomplete.com/articles/bin-packing/
 */


class Packer {
    constructor() {
        this.root = { x: 0, y: 0, w: 1, h: 1 }; // placeholder
    };

    fit(blocks) {
        var n, node, block;
        this.root = { x: 0, y: 0, w: blocks[0].w, h: blocks[0].h };
        for (n = 0; n < blocks.length; n++) {
            block = blocks[n];
            if (node = this.findNode(this.root, block.w, block.h))
                block.fit = this.splitNode(node, block.w, block.h);
            else
                block.fit = this.growNode(block.w, block.h);
        }
    }

    findNode(root, w, h) {
        if (root.used)
            return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
        else if ((w <= root.w) && (h <= root.h))
            return root;
        else
            return null;
    }

    splitNode(node, w, h) {
        node.used = true;
        node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
        node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };
        return node;
    }
    
    growNode(w, h) {
        var canGrowDown = (w <= this.root.w);
        var canGrowRight = (h <= this.root.h);

        // keepts things square
        var shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w));
        var shouldGrowDown = canGrowDown && (this.root.w >= (this.root.h + h));

        if (shouldGrowRight)
            return this.growRight(w, h);
        else if (shouldGrowDown)
            return this.growDown(w, h);
        else if (canGrowRight)
            return this.growRight(w, h);
        else if (canGrowDown)
            return this.growDown(w, h);
        else
            return null; // need to ensure sensible root starting size to avoid this happening
    }
}