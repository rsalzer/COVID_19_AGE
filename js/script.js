var data;
var detaildata;
var deaths;
var hospitalised;

var ageLabels = ["0-9","10-19","20-29","30-39","40-49","50-59","60-69","70-79","80+"];
var genderLabels = {
  "m": "Männer",
  "f": "Frauen",
  "both": "Alle"
};

var genderColours = {
  "f": 'rgba(255, 80, 80, 1.0)',
  "m": 'rgba(80, 80, 255, 1.0)',
}
var ageColours = {
  "0-9": 'rgb(44, 106, 105)',
  "10-19": 'rgb(54, 147, 129)',
  "20-29": 'rgb(76, 178, 134)',
  "30-39": 'rgb(104, 200, 128)',
  "40-49": 'rgb(134, 212, 117)',
  "50-59": 'rgb(161, 215, 108)',
  "60-69": 'rgb(179, 209, 109)',
  "70-79": 'rgb(184, 193, 127)',
  "80+": 'rgb(183, 191, 130)',
  "missing": 'rgb(100,100,100)'
};

function getDataLabels() {
  return {
      color: inDarkMode() ? '#ccc' : 'black',
      font: {
        weight: 'bold',
      },
      align: 'end',
      anchor: 'end',
      formatter: function(value, context) {
        var sum = context.dataset.data.reduce( (acc, val) => acc+val, 0);
        var percentage = Math.round(value / sum * 1000) / 10;
        return percentage+"%";
      }
  };
}

var app = angular.module('age', ['chart.js']);

app.controller('BarCtrl', ['$scope', function ($scope) {
  $scope.type = "bar";
  $scope.options = {
    legend: { display: false },
    tooltips: {
        intersect: false
    },
    title: {
        display: true,
        text: "Altersverteilung",
        padding: 15
    },
    plugins: {
      datalabels: getDataLabels()
    }
  };
  $scope.labels = ageLabels;
  $scope.series = ['Fälle'];
  $scope.data = [
    [0,0,0,0,0,0,0,0,0]
  ];
  $scope.colors = [{
    backgroundColor: ["#2c6a69", "#369381", "#4cb286", "#68c880", "#86d475", "#a1d76c", "#b3d16d", "#b8c17f", "#b7bf82"]
  }];
  $scope.sex = 3;
  $scope.women = function() { $scope.sex = 1; $scope.update(); }
  $scope.men = function() { $scope.sex = 2; $scope.update(); }
  $scope.allSexes = function() { $scope.sex = 3; $scope.update(); }

  $scope.set = 1;
  $scope.cases = function() { $scope.set = 1; $scope.update(); }
  $scope.deaths = function() { $scope.set = 2; $scope.update(); }
  $scope.incidences = function() { $scope.set = 3; $scope.update(); }
  $scope.hosp = function() { $scope.set = 4; $scope.update(); }

  $scope.duration = 1;
  $scope.whole = function() { $scope.duration = 1; $scope.update(); }
  $scope.secondWave = function() { $scope.duration = 2; $scope.update(); }
  $scope.last7Days = function() { $scope.duration = 3; $scope.update(); }
  $scope.last14Days = function() { $scope.duration = 4; $scope.update(); }

  $scope.update = function() {
    let dataToUse;
    dataToUse = $scope.set==1?detaildata:($scope.set==2?deaths:($scope.set==3?data:hospitalised));
    $scope.series[0] = $scope.set==1?'Fälle':($scope.set==2?'Todesfälle':($scope.set==3?'Inzidenz':'Hospitalisierungen'));
    let index = dataToUse.length-6;
    if($scope.duration==2) index = dataToUse.findIndex(d=> d.date == "2020-05-31");
    else if($scope.duration==4) index = dataToUse.length-11;
    let firstData = dataToUse[index];
    let latestData = dataToUse[dataToUse.length-1];
    for(var i=0; i<ageLabels.length; i++) {
      let label = ageLabels[i];
      let f = Math.round(parseFloat(latestData["f"+label]));
      let m = Math.round(parseFloat(latestData["m"+label]));
      let tot = f+m;

      if($scope.duration!=1) {
        let fFirst = Math.round(parseFloat(firstData["f"+label]));
        let mFirst = Math.round(parseFloat(firstData["m"+label]));
        let totFirst = fFirst+mFirst;

        f = f-fFirst;
        m = m-mFirst;
        tot = tot-totFirst;
      }

      $scope.data[0][i] = $scope.sex==3?tot:$scope.sex==2?m:f;
    }
    if($scope.set==3) $scope.options.plugins.datalabels = false;
    else $scope.options.plugins.datalabels = getDataLabels();

    var dataset = $scope.set==1?"Fälle":$scope.set==2?"Todesfälle":$scope.set==3?"Inzidenzen":"Hospitalisierungen";
    var time = $scope.duration==1?"Ganze Pandemie":$scope.duration==2?"Ab Juni":$scope.duration==3?"Letzte 7 Tage":"Letzte 14 Tage";
    $scope.options.title.text = "Altersverteilung "+dataset+" "+time;
  }


}]);



Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";

// d3.json('https://api.github.com/repos/rsalzer/COVID_19_AGE/commits?path=incidences.csv&page=1&per_page=1', function(error, data) {
//   var lastUpdateDiv = document.getElementById('latestUpdate');
//   lastUpdateDiv.innerHTML = "<i>Letztes Update der Daten: "+data[0].commit.committer.date.substring(0,10)+" ("+data[0].commit.message+")</i>";
// });
includeHTML();
setLanguageNav();

function processData() {
  var div = document.getElementById("maindiv");
  chartSingleAgeSex('f');
  chartSingleAgeSex('m');
  for(var i=0; i<ageLabels.length; i++) {
    chartAgesBothSexes(ageLabels[i]);
    barChartDetails(ageLabels[i],'f');
    barChartDetails(ageLabels[i],'m');
  }
}

downloadAllAges();



function downloadAllAges() {
  var url = "https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/";
  d3.csv(url+'data/incidences.csv', function(error, csvdata) {
    data = csvdata;
  });
  downloadAgesDetails();
}

function downloadAgesDetails() {
  var url = "https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/";
  d3.csv(url+'data/allagesdetails.csv', function(error, csvdata) {
    detaildata = csvdata;
    var angularDiv = document.getElementById("interactive");
    var scope = angular.element(angularDiv).scope()
    scope.update();
    scope.$apply();
    var latest = detaildata[detaildata.length-1];
    var keys = Object.keys(latest);
    var latestArray = keys.map(function(key){
      return latest[key];
    });
    var ftotal = latestArray.slice(1,10).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var mtotal = latestArray.slice(10,19).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var div = document.getElementById("latest");
    var dateParts = latest.date.split("-");
    var year = dateParts[0];
    var month = parseInt(dateParts[1]);
    var day = parseInt(dateParts[2]);
    var dateString = day+"."+month+"."+year;
    div.innerHTML = "<h3><span>Positiv getestet bis zum </span>"+dateString+"</h3>"
    var table = document.createElement("table");
    table.id = "firstTable";
    table.innerHTML = "<tr><th>Alter</th><th>Frauen</th><th>%</th><th>Männer</th><th>%</th><th>Gesamt</th><th>%</th></tr>";
    var totalArray = [];
    for(var i=0; i<ageLabels.length; i++) {
      var tr = document.createElement("tr");
      var label = ageLabels[i];
      var f = parseInt(latest["f"+label]);
      var m = parseInt(latest["m"+label]);
      var tot = f+m;
      var percentagef = Math.round(f/ftotal*1000)/10;
      var percentagem = Math.round(m/mtotal*1000)/10;
      var percentagetot = Math.round(tot/(ftotal+mtotal)*1000)/10;
      tr.innerHTML = "<th>"+label+"</th><td>"+f+"</td><td>"+percentagef+"%</td><td>"+m+"</td><td>"+percentagem+"%</td><td>"+tot+"</td><td>"+percentagetot+"%</td>";
      table.appendChild(tr);
    }
    var bag = parseInt(latest.totalbag);
    var all = ftotal+mtotal;
    var missing = bag-all;
    var missingPerc = Math.round(missing/bag*1000)/10;
    var tr = document.createElement("tr");
    var percentagef = Math.round(ftotal/all*1000)/10;
    var percentagem = Math.round(mtotal/all*1000)/10;
    tr.innerHTML = "<th>TOTAL</th><td>"+ftotal+"</td><td>"+percentagef+"%</td><td>"+mtotal+"</td><td>"+percentagem+"%</td><td>"+all+"</td><td></td>";
    table.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = "<th colspan=3>Ohne Altersangabe</th><td></td><td></td><td>"+missing+"</td><td>"+missingPerc+"%</td>";
    table.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = "<th colspan=3>Zahl aller Meldungen</th><td></td><td></td><td>"+bag+"</td><td></td>";
    table.appendChild(tr);
    div.appendChild(table);
    loadDeaths();
    });
}


function loadDeaths() {
  var url = "https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/";
  d3.csv(url+'data/deaths.csv', function(error, csvdata) {
    deaths = csvdata;
    var latestDeaths = deaths[deaths.length-1];
    var latest = detaildata[detaildata.length-1];
    var keys = Object.keys(latestDeaths);
    var latestDeathsArray = keys.map(function(key){
      return latestDeaths[key];
    });
    var ftotal = latestDeathsArray.slice(1,10).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var mtotal = latestDeathsArray.slice(10,19).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var div = document.getElementById("deaths");
    var h3 = document.createElement("h3");
    var dateParts = latestDeaths.date.split("-");
    var year = dateParts[0];
    var month = parseInt(dateParts[1]);
    var day = parseInt(dateParts[2]);
    var dateString = day+"."+month+"."+year;
    h3.innerHTML = '<span>Todesfälle bis zum </span>'+dateString;
    div.appendChild(h3);
    var table = document.createElement("table");
    table.id = "deathTable";
    var mortalitytable = document.createElement("table");
    mortalitytable.id = "mortalityTable";
    table.innerHTML = "<tr><th>Alter</th><th>Frauen</th><th>%</th><th>Männer</th><th>%</th><th>Gesamt</th><th>%</th></tr>";
    mortalitytable.innerHTML = "<tr><th>Alter</th><th>Frauen</th><th>Männer</th><th>Gesamt</th></tr>";
    var sum = 0;
    var sumf = 0;
    var summ = 0;
    var sumcasesm = 0;
    var sumcasesf = 0;
    var totalArray = [];
    for(var i=0; i<ageLabels.length; i++) {
      var tr = document.createElement("tr");
      var label = ageLabels[i];
      var f = parseInt(latestDeaths["f"+label]);
      var fcases = parseInt(latest["f"+label]);
      var m = parseInt(latestDeaths["m"+label]);
      var mcases = parseInt(latest["m"+label]);
      var tot = f+m;
      var percf = Math.round(f/ftotal*1000)/10;
      var percm = Math.round(m/mtotal*1000)/10;
      var perctot = Math.round(tot/(ftotal+mtotal)*1000)/10;
      var totcases = mcases + fcases;
      var fmortality = Math.round(f/fcases*100*100)/100;
      var mmortality = Math.round(m/mcases*100*100)/100;
      var totmortality = Math.round(tot/totcases*100*100)/100;
      totalArray.push(tot);
      tr.innerHTML = "<th>"+label+"</th><td>"+f+"</td><td>"+percf+"%</td><td>"+m+"</td><td>"+percm+"%</td><td>"+tot+"</td><td>"+perctot+"%</td>";
      table.appendChild(tr);
      sum += tot;
      summ += m;
      sumf += f;
      sumcasesm += mcases;
      sumcasesf += fcases;
      tr = document.createElement("tr");
      tr.innerHTML = "<th>"+label+"</th><td>"+fmortality+"%</td><td>"+mmortality+"%</td><td>"+totmortality+"%</td>";
      mortalitytable.appendChild(tr);
    }

    var tr = document.createElement("tr");
    var fmortality = Math.round(sumf/sumcasesf*100*100)/100;
    var mmortality = Math.round(summ/sumcasesm*100*100)/100;
    var totmortality = Math.round(sum/parseInt(latest.totalbag)*100*100)/100;
    var percf = Math.round(ftotal/(ftotal+mtotal)*1000)/10;
    var percm = Math.round(mtotal/(ftotal+mtotal)*1000)/10;
    tr.innerHTML = "<th>TOTAL</th><td>"+sumf+"</td><td>"+percf+"%</td><td>"+summ+"</td><td>"+percm+"%</td><td>"+sum+"</td><td></td>";
    table.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = "<th>TOTAL</th><td>"+fmortality+"%</td><td>"+mmortality+"%</td><td>"+totmortality+"%</td>";
    mortalitytable.appendChild(tr);
    div.appendChild(table);
    div = document.getElementById("mortality");
    h3 = document.createElement("h3");
    h3.innerHTML = "<span>Case Fatality Rate bis zum </span>"+dateString+"</h3>";
    div.prepend(h3);
    div.appendChild(mortalitytable);

    loadHospitalised();
  });
}

function loadHospitalised() {
  var url = "https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/";
  d3.csv(url+'data/hospitalised.csv', function(error, csvdata) {
    hospitalised = csvdata;
    var latestHospitalised = hospitalised[hospitalised.length-1];
    var latest = detaildata[detaildata.length-1];
    var keys = Object.keys(latestHospitalised);
    var latestHospitalisedArray = keys.map(function(key){
      return latestHospitalised[key];
    });
    var ftotal = latestHospitalisedArray.slice(1,10).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var mtotal = latestHospitalisedArray.slice(10,19).reduce(function(acc, val) { return acc + parseInt(val); }, 0);
    var div = document.getElementById("hospitalised");
    var h3 = document.createElement("h3");
    var dateParts = latestHospitalised.date.split("-");
    var year = dateParts[0];
    var month = parseInt(dateParts[1]);
    var day = parseInt(dateParts[2]);
    var dateString = day+"."+month+"."+year;
    h3.innerHTML = "<span>Hospitalisierte Fälle bis zum </span>"+dateString;
    div.appendChild(h3);
    var table = document.createElement("table");
    table.id = "hospitalisedTable";
    var hospratetable = document.createElement("table");
    hospratetable.id = "hosprateTable";
    table.innerHTML = "<tr><th>Alter</th><th>Frauen</th><th>%</th><th>Männer</th><th>%</th><th>Gesamt</th><th>%</th></tr>";
    hospratetable.innerHTML = "<tr><th>Alter</th><th>Frauen</th><th>Männer</th><th>Gesamt</th></tr>";
    var sum = 0;
    var sumf = 0;
    var summ = 0;
    var sumcasesm = 0;
    var sumcasesf = 0;
    var totalArray = [];
    for(var i=0; i<ageLabels.length; i++) {
      var tr = document.createElement("tr");
      var label = ageLabels[i];
      var f = parseInt(latestHospitalised["f"+label]);
      var fcases = parseInt(latest["f"+label]);
      var m = parseInt(latestHospitalised["m"+label]);
      var mcases = parseInt(latest["m"+label]);
      var tot = f+m;
      var percf = Math.round(f/ftotal*1000)/10;
      var percm = Math.round(m/mtotal*1000)/10;
      var perctot = Math.round(tot/(ftotal+mtotal)*1000)/10;
      var totcases = mcases + fcases;
      var fmortality = Math.round(f/fcases*100*100)/100;
      var mmortality = Math.round(m/mcases*100*100)/100;
      var totmortality = Math.round(tot/totcases*100*100)/100;
      totalArray.push(tot);
      tr.innerHTML = "<th>"+label+"</th><td>"+f+"</td><td>"+percf+"%</td><td>"+m+"</td><td>"+percm+"%</td><td>"+tot+"</td><td>"+perctot+"%</td>";
      table.appendChild(tr);
      sum += tot;
      summ += m;
      sumf += f;
      sumcasesm += mcases;
      sumcasesf += fcases;
      tr = document.createElement("tr");
      tr.innerHTML = "<th>"+label+"</th><td>"+fmortality+"%</td><td>"+mmortality+"%</td><td>"+totmortality+"%</td>";
      hospratetable.appendChild(tr);
    }

    var tr = document.createElement("tr");
    var fmortality = Math.round(sumf/sumcasesf*100*100)/100;
    var mmortality = Math.round(summ/sumcasesm*100*100)/100;
    var totmortality = Math.round(sum/parseInt(latest.totalbag)*100*100)/100;
    var percf = Math.round(ftotal/(ftotal+mtotal)*1000)/10;
    var percm = Math.round(mtotal/(ftotal+mtotal)*1000)/10;
    tr.innerHTML = "<th>TOTAL</th><td>"+sumf+"</td><td>"+percf+"%</td><td>"+summ+"</td><td>"+percm+"%</td><td>"+sum+"</td><td></td>";
    table.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = "<th>TOTAL</th><td>"+fmortality+"%</td><td>"+mmortality+"%</td><td>"+totmortality+"%</td>";
    hospratetable.appendChild(tr);
    div.appendChild(table);
    div = document.getElementById("hosprate");
    h3 = document.createElement("h3");
    h3.innerHTML = "<span>Hospitalisationsrate bis zum </span>"+dateString+"</h3>";
    div.prepend(h3);
    div.appendChild(hospratetable);

    setTimeout(function(){ processData(); }, 200);
  });
}



function pieChartSingleAgeSexLatest(sex) {
  var div = document.getElementById("maindiv");
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'piechart'+sex;
  canvas.height=300;
  canvas.width=500+data.length*30;
  div.appendChild(canvas);
  var ageArray = [];
  var latestData = data[data.length-1];
  for(var i=0; i<ageLabels.length; i++) {
    if(sex=='both')
      var singleData = Math.round(10*(parseFloat(latestData['m'+ageLabels[i]])+parseFloat(latestData['f'+ageLabels[i]])))/10;
    else {
      var singleData = Math.round(10*(parseFloat(latestData[sex+ageLabels[i]])))/10;
    }
    ageArray.push(singleData);
  }
  var colours = Object.keys(ageColours).map(function(key){
    return ageColours[key];
  });
  var lastDate = data[data.length-1].date;
  var pieChartLabel = "Fälle nach Alter per 100'000 Bewohner am "+lastDate+" "+genderLabels[sex];
  var config = {
    type: 'doughnut',
    data: {
      datasets: [{
        data: ageArray,
        backgroundColor: colours,
        label: pieChartLabel
      }],
      labels: ageLabels
    },
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'left'
      },
      title: {
        display: true,
        text: pieChartLabel
      }
    }
    };
    var chart = new Chart(canvas.id,config);
}

function chartSingleAgeSex(sex) {
  var div = document.getElementById("incidencescanvasdiv");
  var canvas = document.createElement("canvas");
  canvas.height=300;
  canvas.id = "incidences_"+sex;
  canvas.height=300;
  div.appendChild(canvas);
  div.scrollLeft = 1700;
  //canvas.className  = "myClass";
  var dateLabels = data.map(function(d) {return d.date});
  var allAgeData = [];
  for(var i=0; i<ageLabels.length; i++) {
    if(sex=='both') {
      var ageGroup = data.map(function(d) {return Math.round(10*(parseFloat(d['m'+ageLabels[i]])+parseFloat(d['f'+ageLabels[i]])))/10});
    }
    else {
      var ageGroup = data.map(function(d) {return Math.round(10*parseFloat(d[sex+ageLabels[i]]))/10});
    }
    allAgeData.push(ageGroup);
  }
  var chart = new Chart(canvas.id, {
    type: 'bar',
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'left'
      },
      plugins: {
        labels: false
      },
      title: {
        display: true,
        text: _("Fälle nach Alter per 100'000 Bewohner")+" "+_(genderLabels[sex])
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
      yAxes: [{
        stacked: false,
        position: 'right',
        ticks: {
          beginAtZero: true
        },
        gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        }
      }]
  },
  plugins: {
    labels: false
  }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: allAgeData[0],
          backgroundColor: ageColours[ageLabels[0]],
          borderWidth: 1,
          label: ageLabels[0]
        },
        {
          data: allAgeData[1],
          backgroundColor: ageColours[ageLabels[1]],
          borderWidth: 1,
          label: ageLabels[1]
        },
        {
          data: allAgeData[2],
          backgroundColor: ageColours[ageLabels[2]],
          borderWidth: 1,
          label: ageLabels[2]
        },
        {
          data: allAgeData[3],
          backgroundColor: ageColours[ageLabels[3]],
          borderWidth: 1,
          label: ageLabels[3]
        },
        {
          data: allAgeData[4],
          backgroundColor: ageColours[ageLabels[4]],
          borderWidth: 1,
          label: ageLabels[4]
        },
        {
          data: allAgeData[5],
          backgroundColor: ageColours[ageLabels[5]],
          borderWidth: 1,
          label: ageLabels[5]
        },
        {
          data: allAgeData[6],
          backgroundColor: ageColours[ageLabels[6]],
          borderWidth: 1,
          label: ageLabels[6]
        },
        {
          data: allAgeData[7],
          backgroundColor: ageColours[ageLabels[7]],
          borderWidth: 1,
          label: ageLabels[7]
        },
        {
          data: allAgeData[8],
          backgroundColor: ageColours[ageLabels[8]],
          borderWidth: 1,
          label: ageLabels[8]
        }
      ]
    }
  });
}

function chartAgesBothSexes(age) {
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+age;
  var h3 = document.createElement("h3");
  var text = document.createTextNode(_("Altersgruppe")+" "+_(age));
  h3.appendChild(text);
  var a = document.createElement("a");
  a.href = "#top";
  a.innerHTML = "&#x2191;&#xFE0E;";
  a.className = "toplink";
  h3.appendChild(a);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+age;
  var canvas = document.createElement("canvas");
  canvas.height=300;
  canvas.id = age+"_incidences";
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  var dateLabels = data.map(function(d) {return d.date});
  var males = data.map(function(d) {return Math.round(10*parseFloat(d['m'+age]))/10});
  var females = data.map(function(d) {return Math.round(10*parseFloat(d['f'+age]))/10});
  var chart = new Chart(canvas.id, {
    type: 'bar',
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'left'
      },
      title: {
        display: true,
        text: _("Fälle per 100'000 Bewohner für Altersgruppe")+" "+age
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
      yAxes: [{
        stacked: false,
        position: 'right',
        ticks: {
          beginAtZero: true
        },
      }]
  },
  plugins: {
    datalabels: false
  }
    },
    data: {
      labels: dateLabels,
      datasets: [
          {
            data: females,
            backgroundColor: genderColours.f,
            borderWidth: 1,
            label: _(genderLabels.f)
          },
          {
            data: males,
            backgroundColor: genderColours.m,
            borderWidth: 1,
            label: _(genderLabels.m)
          }
      ]
    }
  });
}


function barChartDetails(age, sex) {
  var filteredHospitalisedData = hospitalised.map(function(d) { return d[sex+age] });
  var length = hospitalised.length;
  var shortenedDetailData = detaildata.slice(detaildata.length-length);
  var filteredDetailData = shortenedDetailData.map(function(d) { return d[sex+age] });
  var shortenedDeathData = deaths.slice(deaths.length-length);
  var filteredDeathData = shortenedDeathData.map(function(d) { return d[sex+age] });
  var div = document.getElementById("container_"+age);
  var canvas = document.createElement("canvas");
  canvas.id = "details_"+age+"_"+sex;
  canvas.height=300;
  div.appendChild(canvas);
  div.scrollLeft = 1700;
  var dateLabels = hospitalised.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var datasets = [];
  datasets.push({
    label: _("Fälle"),
    data: filteredDetailData,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#CF5F5F',
    backgroundColor: '#CF5F5F',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  datasets.push({
    label: _("Hospitalisiert"),
    data: filteredHospitalisedData,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#CCCC00',
    backgroundColor: '#CCCC00',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  datasets.push({
    label: _("Verstorben"),
    data: filteredDeathData,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#010101',
    backgroundColor: '#010101',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      layout: {
          padding: {
              right: 20
          }
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: _("Detailzahlen Altersgruppe ")+age+" "+_(genderLabels[sex])
      },
      tooltips: {
        mode: "index",
        intersect: false,
        position: 'average'
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            tooltipFormat: 'DD.MM.YYYY',
            unit: 'day',
            displayFormats: {
              day: 'DD.MM'
            }
          },
          ticks: {
            min: new Date("2020-03-27T23:00:00"),
            max: new Date(),
          },
          gridLines: {
            color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }],
        yAxes: [{
          type: 'linear',
          position: 'right',
          ticks: {
            beginAtZero: true,
            suggestedMax: 10,
          },
          gridLines: {
            color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }]
      },
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: dateLabels,
      datasets: datasets
    }
  });
}

var language;
function setLanguageNav() {
  var lang = window.navigator.userLanguage || window.navigator.language;
  var langParameter = getParameterValue("lang");
  if (langParameter != "") lang = langParameter;
  lang = lang.split("-")[0]; //not interested in de-CH de-DE etc.
  switch(lang) {
    case 'de':
    case 'fr':
    case 'it':
      break;
    default:
      lang = 'en';
  }
  language = lang;
  var mainlanguageButton = document.getElementById("mainlanguage");
  mainlanguageButton.innerHTML = lang.toUpperCase();
  var languagesDiv = document.getElementById("languages");
  var a;
  if(lang!="de") {
    a = document.createElement("a");
    a.href = "index.html?lang=de";
    languagesDiv.appendChild(a);
    a.innerHTML = "DE"
  }
  if(lang!="en") {
    a = document.createElement("a");
    a.href = "index.html?lang=en";
    languagesDiv.appendChild(a);
    a.innerHTML = "EN"
  }
}

function inDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
}

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("nav");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("url");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {elmnt.insertAdjacentHTML("afterbegin", this.responseText);}
          if (this.status == 404) {elmnt.insertAdjacentHTML("afterbegin", "Page not found.");}
          /* Remove the attribute, and call this function once more: */
          elmnt.removeAttribute("url");
          document.getElementById("pagenav_age").className = "here";
          loaded();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      /* Exit the function: */
      return;
    }
  }
}
