'use strict';

var $jit = require('jit'),
    Ctx = require('../common/context.js');

// Hackity node that changes shape according to data.
var ht;
$jit.Hypertree.Plot.NodeTypes.implement({
    varShapeNode: {
        render: function (node, canvas) {
            var proto;
            if (node.data.order === undefined) {
                proto = ht.tips.nodeTypes.square;
            } else {
                proto = ht.tips.nodeTypes.circle;
            }
            proto.node = this.node;
            proto.nodeHelper = this.nodeHelper;
            proto.render(node, canvas);
        },
        contains: function (node, pos) {
            var proto;
            if (node.data.order === undefined) {
                proto = ht.tips.nodeTypes.square;
            } else {
                proto = ht.tips.nodeTypes.circle;
            }
            proto.node = this.node;
            proto.nodeHelper = this.nodeHelper;
            return proto.contains(node, canvas);
        }
    }
});
function loadHypertreeInDiv(div) {
    while (div.hasChildNodes()) {
        div.removeChild(div.childNodes[0]);
    }
    ht = new $jit.Hypertree({
        //id of the visualization container
        injectInto: div.id,
        //canvas width and height
        width: div.width,
        height: div.height,
        //Change node and edge styles such as
        //color, width and dimensions.
        Node: {
            dim: 9,
            type: 'varShapeNode',
            color: "#a9a3c1"
        },
        Edge: {
            lineWidth: 2,
            color: "#c7c2dd"
        },
        onBeforeCompute: function (node) {
            //console.log("centering");
        },
        //Attach event handlers and add text to the
        //labels. This method is only triggered on label
        //creation
        onCreateLabel: function (domElement, node) {
            domElement.innerHTML = node.name;
            $jit.util.addEvent(domElement, 'click', function () {
                ht.onClick(node.id, {
                    onComplete: function () {
                        ht.controller.onComplete();
                    }
                });
            });
        },
        //Change node styles when labels are placed
        //or moved.
        onPlaceLabel: function (domElement, node) {
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';
            if (node._depth <= 1) {
                style.fontSize = "1.1em";
                style.color = "#111";

            } else if (node._depth == 2) {
                style.fontSize = "0.9em";
                style.color = "#333";

            } else {
                style.display = 'none';
            }

            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        },

        onComplete: function () {
            var collectionManager = new CollectionManager();
            //console.log("done");

            //Build the right column relations list.
            //This is done by collecting the information (stored in the data property)
            //for all the nodes adjacent to the centered node.
            var node = ht.graph.getClosestNodeToOrigin("current");
            collectionManager.getAllIdeasCollectionPromise()
                .then(function (allIdeasCollection) {
                    var idea = allIdeasCollection.get(node.id);
                    var suffix = "";
                    if (idea !== undefined) {
                        //Ctx.DEPRECATEDsetCurrentIdea(idea);
                        throw new Error("I didn't port this to the new group separation");
                        var num_posts = idea.get('num_posts'),
                            num_read_posts = idea.get('num_read_posts');
                        if (num_read_posts == num_posts) {
                            suffix = " (" + num_posts + ")";
                        } else if (num_read_posts == 0) {
                            suffix = " (<b>" + num_posts + "</b>)";
                        } else {
                            suffix = " (<b>" + (num_posts - num_read_posts) + "</b>/" + num_posts + ")";
                        }
                    }
                    var html = "<h4>" + node.name + suffix + "</h4><b>Connections:</b>";
                    html += "<ul>";
                    node.eachAdjacency(function (adj) {
                        var child = adj.nodeTo;
                        if (child.data) {
                            var rel = (child.data.band == node.name) ? child.data.relation : node.data.relation;
                            html += "<li onmouseup='setIdea(\"" + child.id + "\");'>" + child.name + "</li>";
                        }
                    });
                    html += "</ul>";
                    $jit.id('inner-details').innerHTML = html;
                });
        }
    });
    return ht;
}

function ideaGraphLoader(json) {
    var div = document.getElementById("infovis");
    var hypertree = loadHypertreeInDiv(div);
    //load JSON data.
    hypertree.loadJSON(json);
    hypertree.refresh();
    return hypertree;
}


module.exports = ideaGraphLoader;
