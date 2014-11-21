function drawTreemap() {
  var nodes = [];
  var years = [];
  var types = [];
  var value = [];
  var colorgen = d3.scale.category20();
  var colors = {};
  var rootNode;

  //default
  var year = 2012;
  var type = "FDI";

  //read value data, then populate industry, year and type variable
  d3.csv("data/tree.csv", function(data) {
    value = data;
    _(data)
      .chain()
      .pluck('Industry')
      .uniq()
      .each(function(d,i) {
        colors[d] = colorgen(i);
      });
    _(data)
      .chain()
      .pluck('Year')
      .uniq()
      .each(function(d,i) {
        years.push(d)
      });
    _(data)
      .chain()
      .pluck('Type')
      .uniq()
      .each(function(d,i) {
        types.push(d)
      });
      
    //read structure data, then draw initial graph
    d3.json("data/tree.json", function(root) {
      rootNode = root;
      initialize(root);
      draw(root, year, type);
    });
  })


  var margin = {top: 50, right: 0, bottom: 0, left: 0},
    width = $("#graph_area_treemap").width(),
    height = $("#graph_area_treemap").parent().height() - margin.top - margin.bottom,
    formatNumber = d3.format(",d"),
    transitioning;

  var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

  var treemap = d3.layout.treemap()
    .sort(function(a, b) { return a.value - b.value; })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

  var svg = d3.select("#graph_area_treemap").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges");

  var grandparent = svg.append("g")
    .attr("class", "grandparent");

  grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

  grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

  var color = function(d) { return colors[d.name]; };

  function draw(root) {
    traverse(root);
    layout(root);
    display(root);
  }

  function update(root) {
    traverse(root);
    layout(root);
      svg.selectAll("g.depth > *").transition().remove();
      d3.transition().each("end", function() {
        display(root);
      });
  }

  function initialize(root) {
    root.x = root.y = 0;
    root.dx = width;
    root.dy = height;
    root.depth = 0;
  }

  function traverse(d) {
    nodes.push(d);
      //get value here
      // d.value = getTotalSize(d);
      d.value = getValue(d, year, type)
    if (d.children) {
      d.children.forEach(function(c) {
        traverse(c);
      });
    } 
  }

  function getValue(node, year, type) {
    var val = 0;
    _(value)
      .chain()
      .uniq()
      .each(function(d,i) {
        //console.log(d);
        if(d.Industry === node.name && d.Year == year && d.Type === type) {
          //console.log(d.Industry, d.Year, d.Type, d.Value);
          //return parseInt(d.Value);
          val = parseInt(d.Value);
        }
      });
    return val;
  }

  function layout(d) {
    if (d.children) {
      treemap.nodes({children: d.children});
      d.children.forEach(function(c) {
        c.x = d.x + c.x * d.dx;
        c.y = d.y + c.y * d.dy;
        c.dx *= d.dx;
        c.dy *= d.dy;
        c.parent = d;
        layout(c);
      });
    }
  }

  function display(d) {
    grandparent
      .datum(d.parent)
      .on("click", transition)
      .select("text")
      .text(name(d));
    
    var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");

    var g = g1.selectAll("g")
      .data(d.children)
      .enter().append("g");

    g.filter(function(d) { return d.children; })
      .classed("children", true)
      .on("click", transition);

    g.selectAll(".child")
      .data(function(d) { return d.children || [d]; })
      .enter().append("rect")
      .attr("class", "child")
      .call(rect);

    g.append("rect")
      .attr("class", "parent")
      .style("fill", function(d) { return color(d) })
      .call(rect)
      .append("title")
      .text(function(d) { return formatNumber(d.value); });

    g.append("text")
      .attr("dy", "1em")
      .text(function(d) { return d.name; })
      .call(text);


    bindMouseover();

    function transition(d) {
      if (transitioning || !d) return;
      transitioning = true;

      var g2 = display(d),
        t1 = g1.transition().duration(750),
        t2 = g2.transition().duration(750);

      // Update the domain only after entering new elements.
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, d.y + d.dy]);

      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });
      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);

      // Transition to the new view.
      t1.selectAll("text").call(text).style("fill-opacity", 0);
      t2.selectAll("text").call(text).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);

      // Remove the old node when the transition is finished.
      t1.remove().each("end", function() {
        svg.style("shape-rendering", "crispEdges");
        transitioning = false;
      });
    }
    return g;
  }

  function text(text) {
    text.attr("x", function(d) { return x(d.x) + 6; })
    .attr("y", function(d) { return y(d.y) + 6; });
  }

  function rect(rect) {
    rect.attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
  }

  function name(d) {
    return d.parent
    ? name(d.parent) + " → " + d.name
    : d.name;
  }

  
  }
  function bindMouseover() {
    $("rect.parent")
      .on({
      mouseenter: function() {
        //console.log("a");
        var value     = $(this).children().text();
        var industry  = $(this).next().text();
        //console.log(value, industry);
        $("#tree_title").text(industry);
        $("#tree_value").text("Value : " + value);
      },
      mouseleave: function() {
        $("#tree_title").text("");
        $("#tree_value").text("");
      }
    });
}