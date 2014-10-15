
var app = angular.module('physioMap', []);

app.controller('MainCtrl', function($scope, riPauseFactory, $interval){
  $interval(function(){
    //$http.get('data/n40078_breaching_ri_pause.json').then(function(response){
      // json is queried every second
      // updating with new data each time!
         var data = riPauseFactory.content;
         console.log(data);
        .map(function(d){ return d; });
        var binNames = d3.keys(data[0]).filter(function(key) { return key != "DAY" && key != "HOUR" && key != "TYPE"; });

        var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;

      data.forEach( function(d) {

        d.DAY = d.DAY.concat(" " + d.HOUR + ":00");

        d.DAY = parseDate(d.DAY);

        d.values = [];

         for (var b=0;b < binNames.length;b++)
         { d.values.push( parseInt(d[+binNames[b]],10));}

       $scope.apMapData = data;

      });

    }
      , 1000);
});

app.factory('physioDataFactory', [function ($http) {

  var obj = {content:null};

  return {
    // getHRAsync : function(callback) {
    //   $http.get('data/n40078_breaching_hr.json').success(console.log(callback),callback);
    //   ;
    // },
    // getSPO2Async : function(callback) {
    //   $http.get('data/n40078_breaching_spo2.json').success(callback);
    // },
    getRIPauseAsync : function() {

      return $http.get('data/n40078_breaching_ri_pause.json').success(function(data) {
        // you can do some processing here
        obj.content = data;
    });
      return obj;
    }
  };
}])

theApp.factory('riPauseFactory', function($http) {

    var obj = {content:null};

    $http.get('data/n40078_breaching_ri_pause.json').success(function(data) {
        // you can do some processing here
        obj.content = data;
    });

    return obj;
});


app.directive('apMap', function(){
  function link(scope, el, attr){



    el = el[0];
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 840 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    buckets =["0","1","3","5","7","10","13","16","19","21","25","30","35","40","45","50","55","60","65","70","80"];

      //var x = d3.time.scale()
    var x = d3.time.scale().range([0, width]);

    var y = d3.scale.ordinal()
      .domain(buckets)
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

      var m = data.map(function(d){ return d.DAY});
        m.push(new Date((+m[m.length-1] - +m[m.length-2]) + +m[m.length-1]))
      var ext = d3.extent(m);

      var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;


      barWidth = width / data.length;

        x.domain(ext);

        var glucose = svg.selectAll(".glucose")
      .data(data)
    .enter( ).append("g")
      .attr("class", "glucose")
      ;
  var glucose2 = glucose.selectAll(".bin")
      .data(function (d) {
          return d.values; })
    .enter( );

    glucose2.append("rect")
      .attr("class", "bin")
      .attr("x", function(d,i,j){
         //console.log(x(glucose2[j].parentNode.__data__.DAY));
          return x(glucose2[j].parentNode.__data__.DAY);
          //
          })

     .attr("y", function(d,i,j) {
         //console.log(data.keys);
         //console.log(glucose2[j].parentNode.__data__);
         var jsonObj = glucose2[j].parentNode.__data__;
         var names = [];
         for (var o in jsonObj) {
            //console.log(o);
             names.push (o);
         }
         return y(names[i]);
         //return y(glucose2[j].parentNode.__data__[j]);
     } )

    .attr("height", y.rangeBand() )
      .attr("width", function (d, i,j) {

          if (j == glucose2.length -1) {
            return x(glucose2[j].parentNode.__data__.DAY) - x(glucose2[j-1].parentNode.__data__.DAY);
          }
          else {
            return  x(glucose2[j+1].parentNode.__data__.DAY) - x(glucose2[j].parentNode.__data__.DAY);
          }
      })
      .style("fill", function(d) { return z(d); });

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
