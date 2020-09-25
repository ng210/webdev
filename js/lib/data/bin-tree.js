(function() {

    function BinaryNode(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;

        this.first = null;
        this.second = null;

        this.objects = [];
    }
    BinaryNode.prototype.insert = function insert(obj) {
        this.objects.push(obj);
    };
    BinaryNode.prototype.remove = function remove(obj) {
        var ix = this.objects.findIndex(x => x==obj);
        this.objects.splice(ix, 1);
    };

    function BinaryTree(maxLevel, width, height) {
        this.objectQuadMap = {};
        this.root = null;
        this.nodes = [];

        // create full binary tree of BinaryNode objects
        var nodeCount = 1
        var isHorizontal = width > height;
        //var width = 1, height = 1;
        // add root
        this.root = new BinaryNode(0, 0, width, height);
        this.nodes.push(this.root);
        var ni = 2;
        for (var i=0; i<maxLevel; i++) {
            isHorizontal ? width /= 2 : height /= 2;
            for (var n=0; n<nodeCount; n++) {
                var parent = this.nodes[Math.round(ni/2) - 1];
                if (isHorizontal) {
                    parent.first = new BinaryNode(parent.left, parent.top, width, height);
                    this.nodes.push(parent.first);
                    ni++;
                    parent.second = new BinaryNode(parent.left+width, parent.top, width, height);
                    this.nodes.push(parent.second);
                    ni++;
                } else {
                    parent.first = new BinaryNode(parent.left, parent.top, width, height);
                    this.nodes.push(parent.first);
                    ni++;
                    parent.second = new BinaryNode(parent.left, parent.top+height, width, height);
                    this.nodes.push(parent.second);
                    ni++;
                }
            }
            nodeCount *= 2;
            isHorizontal = !isHorizontal;
        }
    }

    BinaryTree.prototype.find = function find(left, top, right, bottom) {
        var node = this.root;
        while (true) {

        }
    };

    BinaryTree.prototype.insert = function insert(obj, left, top, right, bottom) {
        // find containing quad
        var quad = this.find(left, top, right, bottom);
        // insert obj
        if (quad) quad.insert(obj);
    };

    publish(BinaryTree, 'BinaryTree');
})();