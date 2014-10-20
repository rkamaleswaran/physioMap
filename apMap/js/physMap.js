
var app = angular.module('physioMap', ['ui.bootstrap']);



app.controller('MainCtrl', function($scope, physioFactory, $interval){

  var currentPatient = '';

  updatePatient = function(user) {
    $scope.currentPatient = user;
  }

  $interval(function(){
      // json is queried every second
      // updating with new data each time!
      //

       changeMap = function(tab) {
      physioFactory(tab,$scope.currentPatient).success(function(data) {
              // processing the JSON input (extracting keys & values)
              var binNames = d3.keys(data[0]).filter(function(key) { return key != "DAY" && key != "PATIENT" && key != "HOUR" && key != "TYPE" && key != "UN"; });
              var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;
              var obj = {};

              //preprocess dates and separate keyvals for d3 render
              data.forEach( function(d) {
              d.DAY = d.DAY.concat(" " + d.HOUR + ":00");
              d.DAY = parseDate(d.DAY);

              d.values = [];
                 for (var b=0;b < binNames.length;b++)
                 { d.values.push( parseInt(d[+binNames[b]],10));}
              });

              //add data to ng scope
              $scope.apMapData = data;
          });
    }
  }
      , 1000);
});

app.controller('TabCtrl', function($scope,tabFactory) {

  $scope.tab = 'ri_pause';

  $scope.setTab = function(tab) {
    $scope.tab = tab;
    changeMap(tab);
    changeMapColor(tab);
  };

  $scope.isSet = function(tab) {
    return ($scope.tab === tab);
  };

  $scope.update = function(user) {
    updatePatient(user);
  }

})

app.factory('physioFactory', function($http) {
           var obj = {content:null};
             return function (id,user) {
                return $http({
                  method: 'GET',
                  url: "data/"+ user +"_breaching_" + id + ".json"
                });
             }
         });

app.factory('tabFactory', [function ($rootScope) {
  var mySelected = {};

    mySelected.tab = '';

    mySelected.prepForBroadcast = function(msg) {
      this.tab = msg;
      this.broadcastItem();
    };

    mySelected.broadcastItem = function() {
      $rootScope.$broadcast('handleBroadcast');
    };

  return mySelected;
}])

app.directive('apMap', function(){
  function link(scope, el, attr){
    el = el[0];
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 840 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

      //var x = d3.time.scale()
    var x = d3.time.scale().range([0, width]);

    var y = d3.scale.ordinal()
      .rangeRoundBands([height, 0], .05);

    var z = d3.scale.linear()
      .domain([00, 30])
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

    changeMapColor = function(tab) {
      switch (tab) {
         case 'ri_pause': z.range(["white", "purple"]);
              break;
         case 'hr' : z.range(["white", "red"]);
              break;
         case 'spo2': z.range(["white", "orange"]);
              break;
          default: z.range(["white", "black"]);
      };
    };

    scope.$watch('data', function(data){

       if(!data){ return; };

       if(data){ svg.selectAll("*").remove()
                  ; };

        var binNames = d3.keys(data[0])
            .filter(function(key) {
              return key != "DAY" &&
              key != "HOUR" &&
              key != "PATIENT" &&
              key != "values" &&
              key != "TYPE" &&
              key != "UN";
              });

        var m = data.map(function(d){
          return d.DAY
          });

          m.push(new Date((+m[m.length-1] - +m[m.length-2]) + +m[m.length-1]))

        var ext = d3.extent(m);

        var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;

        y.domain(binNames);

        x.domain(ext);

        var physMap = svg.selectAll(".physMap")
          .data(data)
          .enter( ).append("g")
          .attr("class", "physMap")
          ;

        var mapBins = physMap.selectAll(".bin")
              .data(function (d) {
              return d.values; })
              .enter();

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

app.directive('searchPatient', [function () {
  return {
    restrict: 'E',
    templateUrl: 'pages/searchPatient.html'
  };
}])

app.directive('navMenu', [function () {
  return {
    restrict: 'E',
    templateUrl: 'pages/navMenu.html'
  };
}])

app.controller('fillCtrl', function ($scope, $http) {

  getPatients();

  function getPatients() {
     $http.get('data/patients.json').success(function(data){
      console.log(data);
      $scope.patients = data;
    });
  };

})

app.controller('TabsCtrl', function ($scope) {
  $scope.tabs = [
    { title:'Respiratory Pause Map', disabled: true },
    { title:'Heart Rate Variation Map', disabled: true },
    { title:'SpO2 Variation Map', disabled: true },
  ];
});
