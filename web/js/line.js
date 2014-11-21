var line_chart,
    bar_chart,
    para_chart,
    bar_chart_by_industry,
    line_chart_by_industry,
    donut_chart,
    fulldata,
    fulldata_para,
    fulldata_donut,
    datastream,
    highlight   = "none",
    countries   = [],
    years       = [],
    dimensions  = [],
    types       = [],
    ind_dim     = [],
    ind_colors  = [],
    colorgen    = d3.scale.category20();

//read data
d3.csv('data/country.csv', function(data) {
  fulldata = data;
  fulldata = popPrev(fulldata);
  popArr(data);
  formatData(data, "Total")
  drawLineGraph(datastream, '#chart_line_total svg');
  showByCountry(year, type);
});

d3.csv('data/industry.csv', function(data) {
  fulldata_para = data;
  popDim(data);
  showByIndustry(year);
});

d3.csv('data/donut.csv', function(data) {
  fulldata_donut = data;
  showDonut(year);
})

function drawDonut(data, svg) {
  nv.addGraph(function() {
    var chart = nv.models.pieChart()
        .x(function(d) { return d.Type })
        .y(function(d) { return parseInt(d.Value) })
        .showLegend(false)
        .showLabels(true)     //Display pie labels
        .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
        .labelType("key") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
        .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
        .donutRatio(0.30)     //Configure how big you want the donut hole size to be.
        .tooltips(true);
    chart.color(["#8F8888","#CFC6C6", "#4D4D4D"]);

    chart.tooltipContent(function (key, y, e, graph) {
      var prev = getPrevYearTotal(year, key);
      var returnstr = ('<h4>' + key +'</h4>' + '<p> ' + y + '% </p>');
      if(parseFloat(prev) > 0) {
        returnstr += ('<p class="prev positive">'+ prev + '</p>')
      } else {
        returnstr += ('<p class="prev negative">'+ prev + '</p>')
      }

      return returnstr;
    });
    d3.select(svg)
          .datum(data)
          .transition().duration(350)
          .call(chart);
    initDonutClick();
    donut_chart = chart;
  });
}

function drawBarChartByIndustry(data, svg) {
  //FDI only
  sortDataIndustry(data);
  nv.addGraph(function() {
    var chart = nv.models.multiBarHorizontalChart()
                  .margin({ left: 120, right: 50 })
                  .x(function(d) { return d.label })    //Specify the data accessors.
                  .y(function(d) { return d.value })
                  .tooltips(true)        
                  .showValues(true)       
                  .valueFormat(d3.format('s'))
                  .transitionDuration(350)
                  .stacked(true)
                  .showControls(false)
                  .showLegend(false);
    chart.color(function(d) {
      return "#707070";
    });
    chart.tooltipContent(function (key, y, e, graph) {
      var prev = getPrevYearIndustry(y, year, country);
      var returnstr = ('<h4>' + y +'</h4>' + '<p> ' +key + ' : ' + e + '</p>');
      if(parseFloat(prev) > 0) {
        returnstr += ('<p class="prev positive">'+ prev + '</p>')
      } else {
        returnstr += ('<p class="prev negative">'+ prev + '</p>')
      }
      return returnstr;
    });
    chart.yAxis
        .tickFormat(d3.format('s'))
        .axisLabel('Value');
        
    d3.select(svg)
        .datum(data)
        .call(chart);

    nv.utils.windowResize(chart.update);

    initIndustryBarClick();

    bar_chart_by_industry = chart;
  });
}

function formatDonut(data, year) {
  var ret = [];
  $('#donut_FDEI').text("FDEI :  n/a");
  $('#donut_FPEI').text("FDEI :  n/a");
  data.forEach(function(d) {
    if(parseInt(d.Year) == year) {

      if(d.Type == "FDEI") {
        $('#donut_FDEI').text("FDEI : " + d.Value + "%");
      } else if (d.Type == "FPEI") {
        $('#donut_FPEI').text("FPEI : " + d.Value  + "%");
      }
      ret.push(d);
    }
  });
  return ret;
}

function showByIndustry(year, country) {
  if(!country) {country = "Total";};
  var data = formatDataByIndustry(fulldata_para, country, parseInt(year));
  drawBarChartByIndustry(data, '#chart_bar_industry svg');
  $('#industry_year').text(year);
}

function drawLineGraphByIndustry(data, svg) {
  nv.addGraph(function() {
      var chart = nv.models.lineChart()
                    .margin({ left: 55, right: 50 })
                    .x(function(d) { return parseInt(d.Year)  })   
                    .y(function(d) { return parseInt(d.Value) })   
                    .useInteractiveGuideline(true)
                    .transitionDuration(500);
      chart.xAxis
          .tickValues(years)
          .axisLabel('Year');
      chart.yAxis
          .tickFormat(d3.format('s'))
          .axisLabel('Value');
      chart.color(function(d) {
        return ind_colors[d.key];
      })

      d3.select(svg)
        .datum(data)
        .call(chart);

      // responsive design
      nv.utils.windowResize(chart.update);

      line_chart_by_industry = chart;
    });
}

function formatLineByIndustry(data, country, industries) {
  var retArr = [];
  industries.forEach(function(industry) {
    var ret = {key:industry, values:[]};
    data.forEach(function(d) {
      if(d.Country == country) {
        for(var attr in d) {
          if(attr == industry) {
            ret.values.push({Value:d[attr], Year:d.Year});
          }
        }
      }
    });
    retArr.push(ret);
  });
  return retArr;
}

function showLineByIndustry(industries) {
  var data = formatLineByIndustry(fulldata_para, "Total", industries);
  drawLineGraphByIndustry(data, '#chart_line_industry svg');
}

function showDonut(year) {
  var data = formatDonut(fulldata_donut, year);
  drawDonut(data, '#chart_donut svg');
  $('#donut_year').text(year);
}

function formatDataByIndustry(data, country, year) {
  var ret = {key:"FDI", values:[], year:year};
  data.forEach(function(d) {
    if(d.Country == country && d.Year == year) {
      for(var attr in d) {
        if(attr != "Region" && attr != "Country" && attr != "Total" && attr != "Year") {
          var obj = {label:attr, value:parseInt(d[attr])}
          ret.values.push(obj);
        }
      }
    }
  });
  return [ret];
}

function drawLineGraph(data, svg) {
  nv.addGraph(function() {
    var chart = nv.models.lineChart()
                  .margin({ left: 55, right: 55 })
                  .x(function(d) { return parseInt(d.Year)  })   
                  .y(function(d) { return parseInt(d.Value) })   
                  .forceY(0)
                  .transitionDuration(500)
                  .useInteractiveGuideline(true)
                  .showLegend(false)
                  .tooltips(true);
    chart.xAxis
        .axisLabel('Year');
    chart.yAxis
        .tickFormat(d3.format('s'))
        .axisLabel('Value');
    chart.color(["#800000","#452C2C","#8F8888","#A6A6A6"])
    d3.select(svg)
      .datum(data)
      .call(chart);
    
    // responsive design
    nv.utils.windowResize(chart.update);
    line_chart = chart;
  });
}

function displayGrowth() {
  line_chart.y(function(d) { return parseFloat(d.prev)  }) ;
  line_chart.yAxis.tickFormat(function(d) { return d + "%"; }).axisLabel('Growth');
  line_chart.update();
}

function displayValue() {
  line_chart.y(function(d) { return parseInt(d.Value)  }) ;
  line_chart.yAxis.tickFormat(d3.format('s')).axisLabel('Value');
  line_chart.update();
}

function drawBarChart(data, svg, type) {
  d3.selectAll(".country_selected").classed("country_selected", false);
  nv.addGraph(function() {
    data = sortData(data, type);
    data = getStream(data, type);
    var chart = nv.models.multiBarHorizontalChart()
                  .margin({left:120, right:50})
                  .x(function(d) { return d.Country})   
                  .y(function(d) { return parseInt(d.Value)})   
                  .transitionDuration(500)
                  .stacked(true)
                  .showControls(false)
                  .showLegend(false);
    chart.yAxis
        .tickFormat(d3.format('s'));
    chart.tooltipContent(function (key, y, e, graph) {
      var prev = getPrevYearCountry(year, y, key);
      var returnstr = ('<h4>' + y +'</h4>' + '<p> ' +key + ' : ' + e + '</p>');
      
      if(parseFloat(prev) > 0) {
        returnstr += ('<p class="prev positive">'+ prev + '</p>')
      } else {
        returnstr += ('<p class="prev negative">'+ prev + '</p>')
      }
      
      return returnstr;
    });
    chart.color(function(d) {
      return "#707070";
    });

    d3.select(svg)
        .datum(data)
        .transition().duration(500)
        .call(chart);

    nv.utils.windowResize(chart.update);
    
    initBarClick();

    bar_chart = chart;
  });
}

function formatData(data, country, year, noTotal) {
  datastream  = [];
  var FDIstream   = {key:"FDI",   values:[]},
      FEIstream   = {key:"FEI",   values:[]},
      FPEIstream  = {key:"FPEI",  values:[]},
      FDEIstream  = {key:"FDEI",  values:[]};

  _(data).each(function(d) {
    if(
      (d.Country == country     || !country) &&
      (d.Country != "Total"     || !noTotal) &&
      (parseInt(d.Year) == year || !year)
    ) {
      switch(d.Type) {
        case "FDI":
          FDIstream.values.push(d);
          break;
        case "FEI":
          FEIstream.values.push(d);
          break;
        case "FDEI":
          FDEIstream.values.push(d);
          break;
        case "FPEI":
          FPEIstream.values.push(d);
          break;
      }
    }
  });
  datastream.push(FDIstream);
  datastream.push(FEIstream);
  datastream.push(FDEIstream);
  datastream.push(FPEIstream);
}

function popArr(data) {
  _(data).chain().pluck('Country').uniq().each(function(d) {
    countries.push(d);
  });
  _(data).chain().pluck('Year').uniq().each(function(d) {
    years.push(parseInt(d));
  });
  _(data).chain().pluck('Type').uniq().each(function(d) {
    types.push(d);
  });
  popType();
}

function popDim(data) {
  for (var attr in data[0]) {
    if(attr != "Year" && attr!= "Region") {
      dimensions.push(attr);
      if(attr != "Country" && attr != "Total") {
        ind_dim.push(attr);
      }
    }
  }
  ind_dim.forEach(function(d, i) {
    ind_colors[d] = colorgen(i);
  })
}

function popType() {  
  $('#select_type').selectpicker({
  });
  types.forEach(function(d) {
    $('#select_type')
      .append('<option value=' + d + '>' + d + '</option>').selectpicker('refresh');
  });
  $('.selectpicker').selectpicker('val', type);
}

function showByCountry(year, type) {
  formatData(fulldata, "", year, true);
  drawBarChart(datastream, '#chart_bar svg', type);
  $('#country_year').text(year);
}

function sortData(data, byType) {
  var compare = data.filter(function(d) {
    return d.key === byType;
  });
  compare.forEach(function(d) {
    d.values.sort(function(a, b){ 
      return parseInt(b.Value) - parseInt(a.Value);
    });
  });

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

function sortDataIndustry(data) {
  data.filter(function(d) {
    return d.key == "FDI";
  });
  data.forEach(function(d) {
    d.values.sort(function(a, b){ 
      return b.value - a.value;
    });
  });
}

function getStream(data, byType) {
  var ret = [];
  data.forEach(function(type) {
    if(type.key == byType) {
      ret.push(type);
    }
  })
  return ret;
  ;
}

function getPrevYearIndustry(industry, curYear, country) {
  var ret;
  var thisYear;
  var prevYear;
  data = fulldata_para.filter(function(d) {
    if(d.Country == country && parseInt(d.Year) == curYear) {
      for(var attr in d) {
        if(attr == industry) {
          thisYear = d[attr];
        }
      }
    }
    if(d.Country == country && parseInt(d.Year) == curYear-1) {
      for(var attr in d) {
        if(attr == industry) {
          prevYear = d[attr];
        }
      }
    }
  });
  var ret = calcIncrease(thisYear, prevYear).toFixed(2);
  if(!isNaN(ret) && isFinite(ret)) {
    return ret + "%";
  }
  return "n/a"
}

function getPrevYearCountry(curYear, country, type) {
  var ret;
  var thisYear;
  var prevYear;
  data = fulldata.filter(function(d) {
    if(d.Country == country && parseInt(d.Year) == curYear && d.Type == type) {
      thisYear = d.Value;
    }
    if(d.Country == country && parseInt(d.Year) == curYear-1 && d.Type == type) {
      prevYear = d.Value;
    }
  });
  var ret = calcIncrease(thisYear, prevYear).toFixed(2);
  if(!isNaN(ret) && isFinite(ret)) {
    return ret + "%";
  }
  return "n/a"
}

function popPrev(data, country) {
  if(!country) {country = "Total"};
  data.forEach(function(d) {
    try {
      var prev = getPrevYearCountry(d.Year, d.Country, d.Type);
      d.prev = prev;
    } catch(err) {
      d.prev = "n/a"
    }
  })
  return data;
}

function getPrevYearTotal(curYear, type) {
  var ret;
  var thisYear;
  var prevYear;
  data = fulldata.filter(function(d) {
    if(d.Country == "Total" && parseInt(d.Year) == curYear && d.Type == type) {
      thisYear = d.Value;
    }
    if(d.Country == "Total" && parseInt(d.Year) == curYear-1 && d.Type == type) {
      prevYear = d.Value;
    }
  });
  var ret = calcIncrease(thisYear, prevYear).toFixed(2);
  if(!isNaN(ret) && isFinite(ret)) {
    return ret + "%";
  }
  return "n/a"
}

function initIndustryBarClick() {
  //make sure only initialised once
  if(!initIndustry) {
    initIndustry = true;
    $('#chart_bar_industry g.nv-bar rect').on('click', function() {
      if(!showLine) {
        $('#chart_line_industry').show('slide', {direction: 'up', duration: 300, easing: 'easeOutCubic'});
      }
      tgindustry = this.__data__.label;
      if(!_.contains(industries, tgindustry)) {
        industries.push(tgindustry);
        showLineByIndustry(industries);
      } else if(industries.length != 1){
        var index = industries.indexOf(tgindustry);
        industries.splice(index, 1);
        showLineByIndustry(industries);
      }
    });
  }
}

function initBarClick() {
  //make sure only initialised once
  if(!init) {
    init = true;
    $('#chart_bar g.nv-bar rect').on('click', function() {
      d3.selectAll(".country_selected").classed("country_selected", false);
      d3.select(this).classed("country_selected", true);
      tgcountry = this.__data__.Country;
      if(country != tgcountry) {
        country = tgcountry;
        showByIndustry(year, tgcountry);
        $('#industry_country').text("from " + tgcountry);
      }
    });
  }
}

function initDonutClick() {
  if(!initDonut) {
    initDonut = true;
    $('#chart_donut g').on('click', function() {
      //console.log(this.__data__.data);
    });
  }
}

function calcIncrease(thisYear, prevYear) {
  return ((thisYear-prevYear)/prevYear)*100 ;
}

function highlightTotalLine(id, type) {
  if(type != "none") {
    d3.selectAll("#" + id + " g.nv-group").transition().style("stroke-opacity", 1);
    d3.selectAll("#" + id + " path.nv-line").transition().style('stroke-width', 1.5);
    $("#" + id + " g.nv-group").each(function(d) {
      if(this.__data__.key != type) {
        d3.select(this).transition().style("stroke-opacity", .2);
      } else {
        d3.select(this).selectAll("path.nv-line").transition().style('stroke-width', 5);
      }
    })
  } else {
    d3.selectAll("#" + id + " g.nv-group").transition().style("stroke-opacity", 1);
    d3.selectAll("#" + id + " path.nv-line").transition().style('stroke-width', 1.5);
  }
}