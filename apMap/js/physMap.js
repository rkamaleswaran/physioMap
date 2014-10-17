
var app = angular.module('physioMap', []);

app.controller('TabCtrl', function($scope, actFactory) {
  this.tab = 'ri_pause';

  this.setTab = function(tab) {
    this.tab = tab;
  };

  this.isSet = function(tab) {
    return (this.tab === tab);
  };

})

app.controller('MainCtrl', function($scope, physioFactory, $interval){

  $interval(function(){
      // json is queried every second
      // updating with new data each time!

      physioFactory('ri_pause').success(function(data) {
              // processing the JSON input (extracting keys & values)
              var binNames = d3.keys(data[0]).filter(function(key) { return key != "DAY" && key != "HOUR" && key != "TYPE"; });
              var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;
              var obj = {};

              //preprocess dates and separate keyvals for d3 render
              data.forEach( function(d) {
              d.DAY = d.DAY.concat(" " + d.HOUR + ":00");
              d.DAY = parseDate(d.DAY);

              //spit out an object with just the key value of each bin
              for (i=0; i<binNames.length; i++) {
                obj[binNames[i]] = parseInt(d[binNames[i]], 10);
              }

              //add object to d in data
              d.obj = obj;

              d.values = [];
                 for (var b=0;b < binNames.length;b++)
                 { d.values.push( parseInt(d[+binNames[b]],10));}
              });

              //add data to ng scope

              $scope.apMapData = data;
          });
    }
      , 1000);
});

app.factory('physioFactory', function($http) {
           var obj = {content:null};
             return function (id) {
                return $http({
                  method: 'GET',
                  url: "data/n40078_breaching_" + id + ".json"
                });
             }
         });

app.factory('tabFactory', [function ($rootScope) {
  var selectedTab = {};

    selectedTab.tab = '';

  return {
    sharedAct;
  };
}])

app.directive('apMap', function(){
  function link(scope, el, attr){
    el = el[0];
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 840 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,

      //var x = d3.time.scale()
    var x = d3.time.scale().range([0, width]);

    var y = d3.scale.ordinal()
      .rangeRoundBands([height, 0], .05);

    var z = d3.scale.linear()
      .domain([00, 30])
      .range(["white", "purple"])
      .interpolate(d3.interpolateLab);

    var formatTime = d3.time.format("%I %p"),
      formatHour = function (d) {
        if (d == 12) return "noon";
        if (d == 24 || d == 0) return "midnight";
        return formatTime(new Date(2013, 2, 9, d, 00));
      };

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      //.tickFormat(formatHour)
      ;

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format("d"));



    var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    scope.$watch('data', function(data){

       if(!data){ return; }
      var binNames = d3.keys(data[0]).filter(function(key) { return key != "DAY" && key != "HOUR" && key != "obj" && key != "values" && key != "TYPE"; });
      var m = data.map(function(d){ return d.DAY});
        m.push(new Date((+m[m.length-1] - +m[m.length-2]) + +m[m.length-1]))
      var ext = d3.extent(m);

      var binWidth = (ext[1] - ext[0]);

      var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;
       y.domain(binNames);

        x.domain(ext);

      var physMap = svg.selectAll(".physMap")
        .data(data)
        .enter( ).append("g")
        .attr("class", "physMap")
        ;

      var mapBins = physMap.selectAll(".bin").data(function (d) {
            return d.values; }).enter();

          mapBins.append("rect")
                .attr("class", "bin")
                .attr("x", function(d,i,j){
                    return x(mapBins[j].parentNode.__data__.DAY);
                })
                .attr("y", function(d,i,j) {
                  return y(binNames[i]);
                })
                .attr("height", y.rangeBand())
                .attr("width", width / data.length)
                .style("fill", function(d) { return z(d); });

      // var glucose2 = glucose.selectAll(".bin")
      //   .data(function (d) {
      //   return d.values; })
      //   .enter( );

      // glucose2.append("rect")
      //   .attr("class", "bin")
      //   .attr("x", function(d,i,j){
      //      //console.log(x(glucose2[j].parentNode.__data__.DAY));
      //       return x(glucose2[j].parentNode.__data__.DAY);
      //       //
      //       })

      //  .attr("y", function(d,i,j) {
      //      //console.log(data.keys);
      //      //console.log(glucose2[j].parentNode.__data__);
      //      var jsonObj = glucose2[j].parentNode.__data__;
      //      var names = [];
      //      for (var o in jsonObj) {
      //         //console.log(o);
      //          names.push (o);
      //      }
      //      return y(names[i]);
      //      //return y(glucose2[j].parentNode.__data__[j]);
      //  } )

      // .attr("height", y.rangeBand() )
      //   .attr("width", function (d, i,j) {

      //       if (j == glucose2.length -1) {
      //         return x(glucose2[j].parentNode.__data__.DAY) - x(glucose2[j-1].parentNode.__data__.DAY);
      //       }
      //       else {
      //         return  x(glucose2[j+1].parentNode.__data__.DAY) - x(glucose2[j].parentNode.__data__.DAY);
      //       }
      //   })
      // .style("fill", function(d) { return z(d); });

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Duration of Pause in Seconds");
    }, true);
  }
  return {
    link: link,
    restrict: 'E',
    scope: { data: '=' }
  };
});
