function drawTotal() {
  var fulldata;
  var chart;
  var country = "Total";
  var countries = [];
  var colorgen = d3.scale.category20();
  var colors = {};

  //populate datastream, draw default graph
  var graph = d3.csv('data/Book3.csv', function(data) {
    fulldata = data;
    _(fulldata).chain()
      .pluck('Type')
      .uniq()
      .each(function(d,i) {
        colors[d] = colorgen(i);
      });

    _(fulldata).chain()
      .pluck('Country')
      .uniq()
      .each(function(d,i) {
        countries.push(d);
      });
    var datastream = filterData(data, country);
    drawChart(datastream);
  });

  color = function(d) { return colors[d.Country]; };

  function filterData(data, country) {
    //type arrays
    var FEI = {key:"FEI", values:[]};
    var FDI = {key:"FDI", values:[]};
    var FPEI = {key:"FPEI", values:[]};
    var FDEI = {key:"FDEI", values:[]};

    var datastream = [];
    _(data).chain()
      .uniq()
      .each(function(d,i) {
        if(d.Country === country) {
          var type = d.Type;
          d.x = d.Year; d.y= parseInt(d.Value);
          switch(type) {
            case "FEI":
              FEI.values.push(d);
              break;
            case "FDI":
              FDI.values.push(d);
              break;
            case "FDEI":
              FDEI.values.push(d);
              break;
            case "FPEI":
              FPEI.values.push(d);
              break;
          }
        }
      });
    datastream.push(FDI);
    datastream.push(FEI);
    datastream.push(FDEI);
    datastream.push(FPEI);
    return datastream;
  }

  function drawChart(datastream) {
    chart = nv.addGraph(function() {
      var chart = nv.models.multiBarChart()
        .transitionDuration(350)
        .reduceXTicks(false)  //If 'false', every single x-axis tick label will be rendered.
        .rotateLabels(0)      //Angle to rotate x-axis labels.
        .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
        .groupSpacing(0.5)    //Distance between each group of bars.
      ;

      chart.yAxis
          .tickFormat(d3.format('s'));

      chart.color(function(d) {
        return colors[d.key];
      });

      d3.select('#graph_area_total svg')
          .datum(datastream)
          .transition().duration(500)
          .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  }
}
