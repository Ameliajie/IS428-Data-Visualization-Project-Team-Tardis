function drawByCountry() {
  var fulldata;
      var chart;
      var year = "2012";
      var years = [];
      var countries = [];
      var colorgen = d3.scale.category20();
      var colors = {};

      //populate datastream, draw default graph
      var graph = d3.csv('data/Book3.csv', function(data) {
        //sort
        // data.sort(function(a,b) {
        //   return data ? ~~(a.Value < b.Value) : ~~(a.Value > b.Value);
        // });

        fulldata = data;
        _(fulldata)
          .chain()
          .pluck('Type')
          .uniq()
          .each(function(d,i) {
            colors[d] = colorgen(i);
          });

        _(fulldata)
          .chain()
          .pluck('Year')
          .uniq()
          .each(function(d,i) {
            years.push(d)
          });

        _(fulldata)
          .chain()
          .pluck('Country')
          .uniq()
          .each(function(d,i) {
            countries.push(d);
          });
        var datastream = filterData(data, year);
        drawChart(datastream, "FDI");
      });

      color = function(d) { return colors[d.Country]; };

      function filterData(data, year) {
        //type arrays
        var FEI = {key:"FEI", values:[]};
        var FDI = {key:"FDI", values:[]};
        var FPEI = {key:"FPEI", values:[]};
        var FDEI = {key:"FDEI", values:[]};

        var datastream = [];
        _(data).chain()
        .uniq()
        .each(function(d,i) {
          if(
            d.Year === year  && 
            d.Country !== "Total"
          ){
            var type = d.Type;
            d.x = d.Country; d.y= parseInt(d.Value);
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

      function filterDataByCountry(data, country, year) {
        //type arrays
        var FEI = {key:"FEI", values:[]};
        var FDI = {key:"FDI", values:[]};
        var FPEI = {key:"FPEI", values:[]};
        var FDEI = {key:"FDEI", values:[]};

        var datastream = [];
        _(data).chain()
        .uniq()
        .each(function(d,i) {
          if(
            d.Year === year  && 
            d.Country === country
          ) {
            var type = d.Type;
            d.x = d.Country; d.y= parseInt(d.Value);
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

      function drawChart(datastream, byType) {
        chart = nv.addGraph(function() {

        datastream = sortData(datastream, byType);

        var chart = nv.models.multiBarHorizontalChart()
          .margin({top: 30, right: 20, bottom: 50, left: 175})
          .stacked(true)
          //.showValues(true)         //Show bar value next to each bar.
          .tooltips(true)             //Show tooltips on hover.
          .transitionDuration(350)
          .showLegend(false)
          .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

          chart.yAxis
          .tickFormat(d3.format('s'));

          // chart.yAxis
          //     .tickFormat(d3.format(',.1f'));

          chart.color(function(d) {
            return colors[d.key];
          });

          d3.select('#graph_area_by_country svg')
            .datum(datastream)
            .transition().duration(500)
            .call(chart);

          nv.utils.windowResize(chart.update);

          return chart;
        });
      }

      
      function sortData(data, byType) {
        var compare = data.filter(function(d) {
             return d.key === byType;
           })
        compare.forEach(function(d) {
          d.values.sort(function(a, b){ 
            return parseInt(b.Value) - parseInt(a.Value);
          });
        })
        console.log("after sort", compare)
        var retArr = [];
        var FEI = {key:"FEI", values:[]};
        var FDI = {key:"FDI", values:[]};
        var FPEI = {key:"FPEI", values:[]};
        var FDEI = {key:"FDEI", values:[]};

        compare[0].values.forEach(function(c) {
          data.forEach(function(d) {
            d.values.forEach(function(e) {
              if(e.Country === c.Country) {
                switch(e.Type) {
                  case "FEI":
                    FEI.values.push(e);
                    break;
                  case "FDI":
                    FDI.values.push(e);
                    break;
                  case "FDEI":
                    FDEI.values.push(e);
                    break;
                  case "FPEI":
                    FPEI.values.push(e);
                    break;
                }
              }
            });
          });
        });
        retArr.push(FDI);
        retArr.push(FEI);
        retArr.push(FDEI);
        retArr.push(FPEI);
        return retArr;
      }
}