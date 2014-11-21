function drawParCoords() {
  var fulldata = [];
  var countries = [];
  var pc_progressive;
  // load csv file and create the chart
  d3.csv('data/para.csv', function(data) {
    fulldata = data;
    var colorgen = d3.scale.category10();
    var colors = {};
    _(data).chain()
      .pluck('Country')
      .uniq()
      .each(function(d,i) {
        countries.push(d);
        colors[d] = colorgen(i);
      });

    color = function(d) { return colors[d.Country]; };

    pc_progressive = d3.parcoords()("#graph_area_parcoords")
      .data(data)
      .color(color)
      .alpha(0.4)
      .margin({ top: 30, left: 65, bottom: 5, right: 0 })
      .mode("queue")
      .rate(10)
      .render()
      .brushMode("1D-axes")  // enable brushing
      .reorderable()
      .interactive()  // command line mode
    pc_progressive.svg.selectAll("text")
      .style("font", "10px sans-serif");
  });
}