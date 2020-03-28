var data;
var detaildata;
var deaths;

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

d3.json('https://api.github.com/repos/rsalzer/COVID_19_AGE/commits?path=allages.csv&page=1&per_page=1', function(error, data) {
  var lastUpdateDiv = document.getElementById('latestUpdate');
  lastUpdateDiv.innerHTML = "<i>Letztes Update der Daten: "+data[0].commit.committer.date.substring(0,10)+" ("+data[0].commit.message+")</i>";
});


d3.csv('allages.csv', function(error, csvdata) {
  data = csvdata;
  var div = document.getElementById("maindiv");
  chartSingleAgeSex('f');
  chartSingleAgeSex('m');
  for(var i=0; i<ageLabels.length; i++) {
    chartAgesBothSexes(ageLabels[i]);
  }
});

d3.csv('allagesdetails.csv', function(error, csvdata) {
  detaildata = csvdata;
  var latest = detaildata[detaildata.length-1];
  var div = document.getElementById("latest");
  div.innerHTML = "<h3>Aktuelle absolute Zahlen "+latest.date+"</h3>"
  var table = document.createElement("table");
  table.id = "firstTable";
  table.innerHTML = "<tr><th>Altersgruppe</th><th>Frauen</th><th>Männer</th><th>Gesamt</th></tr>";
  var sum = 0;
  var sumf = 0;
  var summ = 0;
  var totalArray = [];
  for(var i=0; i<ageLabels.length; i++) {
    var tr = document.createElement("tr");
    var label = ageLabels[i];
    var f = parseInt(latest["f"+label]);
    var m = parseInt(latest["m"+label]);
    var tot = f+m;
    totalArray.push(tot);
    tr.innerHTML = "<th>"+label+"</th><td>"+f+"</td><td>"+m+"</td><td>"+tot+"</td>";
    table.appendChild(tr);
    sum += tot;
    summ += m;
    sumf += f;
  }
  var bag = parseInt(latest.totalbag);
  var missing = bag-sum;
  var missingPerc = Math.round(missing/bag*100);
  totalArray.push(missing);
  var tr = document.createElement("tr");
  tr.innerHTML = "<th>Fehlend</th><td></td><td></td><td>"+missing+" ("+missingPerc+" %)</td>";
  table.appendChild(tr);
  tr = document.createElement("tr");
  tr.innerHTML = "<th>TOTAL</th><td>"+sumf+"</td><td>"+summ+"</td><td>"+bag+"</td>";
  table.appendChild(tr);
  div.appendChild(table);

  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'piechart';
  canvas.height=300;
  canvas.width=500;
  div.appendChild(canvas);
  var labels = ageLabels.slice();
  labels.push("fehlend");
  var colours = Object.keys(ageColours).map(function(key){
    return ageColours[key];
  });
  var lastDate = data[data.length-1].date;
  var pieChartLabel = "Fälle nach Alter "+latest.date;
  var config = {
    type: 'doughnut',
    data: {
      datasets: [{
        data: totalArray,
        backgroundColor: colours,
        label: pieChartLabel
      }],
      labels: labels
    },
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'right'
      },
      title: {
        display: true,
        text: pieChartLabel
      },
      plugins: {
        labels: true
      }
    }
    };
    var chart = new Chart(canvas.id,config);

    loadDeaths();
});


function loadDeaths() {
  d3.csv('deaths.csv', function(error, csvdata) {
    deaths = csvdata;
    var latestDeaths = deaths[deaths.length-1];
    var latest = detaildata[detaildata.length-1];
    var div = document.getElementById("latest");
    var h3 = document.createElement("h3");
    h3.innerHTML = "Todesfälle bis zum "+latestDeaths.date+"</h3>";
    div.appendChild(h3);
    var table = document.createElement("table");
    table.id = "deathTable";
    table.innerHTML = "<tr><th>Altersgruppe</th><th>Frauen</th><th>Sterblichkeit</th><th>Männer</th><th>Sterblichkeit</th><th>Gesamt</th><th>Sterblichkeit</th></tr>";
    var sum = 0;
    var sumf = 0;
    var summ = 0;
    var totalArray = [];
    for(var i=0; i<ageLabels.length; i++) {
      var tr = document.createElement("tr");
      var label = ageLabels[i];
      var f = parseInt(latestDeaths["f"+label]);
      var fcases = parseInt(latest["f"+label]);
      var m = parseInt(latestDeaths["m"+label]);
      var mcases = parseInt(latest["m"+label]);
      var tot = f+m;
      var totcases = mcases + fcases;
      var fmortality = Math.round(f/fcases*100*100)/100;
      var mmortality = Math.round(m/mcases*100*100)/100;
      var totmortality = Math.round(tot/totcases*100*100)/100;
      totalArray.push(tot);
      tr.innerHTML = "<th>"+label+"</th><td>"+f+"</td><td>"+fmortality+"%</td><td>"+m+"</td><td>"+mmortality+"%</td><td>"+tot+"</td><td>"+totmortality+"%</td>";
      table.appendChild(tr);
      sum += tot;
      summ += m;
      sumf += f;
    }

    var tr = document.createElement("tr");
    table.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = "<th>TOTAL</th><td>"+sumf+"</td><td></td><td>"+summ+"</td><td></td><td>"+sum+"</td><td></td>";
    table.appendChild(tr);
    div.appendChild(table);

    var canvas = document.createElement("canvas");
    //canvas.className  = "myClass";
    canvas.id = 'piechartdeath';
    canvas.height=300;
    canvas.width=500;
    div.appendChild(canvas);
    var labels = ageLabels.slice();
    var colours = Object.keys(ageColours).map(function(key){
      return ageColours[key];
    });
    var lastDate = data[data.length-1].date;
    var pieChartLabel = "Todesfälle nach Alter "+latestDeaths.date;
    var config = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: totalArray,
          backgroundColor: colours,
          label: pieChartLabel
        }],
        labels: labels
      },
      options: {
        responsive: false,
        legend: {
          display: true,
          position: 'right'
        },
        title: {
          display: true,
          text: pieChartLabel
        },
        plugins: {
          labels: true
        }
      }
      };
      var chart = new Chart(canvas.id,config);

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
  var div = document.getElementById("maindiv");
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'chart'+sex;
  canvas.height=300;
  canvas.width=500+data.length*30;
  div.appendChild(canvas);
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
        text: "Fälle nach Alter per 100'000 Bewohner "+genderLabels[sex]
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
      yAxes: [{
        stacked: false,
        ticks: {
          beginAtZero: true
        },
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
  var div = document.getElementById("maindiv");
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'chart'+age;
  canvas.height=300;
  canvas.width=500+data.length*30;
  div.appendChild(canvas);
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
        text: "Fälle per 100'000 Bewohner für Altersgruppe "+age
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
      yAxes: [{
        stacked: false,
        ticks: {
          beginAtZero: true
        },
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
            data: females,
            backgroundColor: genderColours.f,
            borderWidth: 1,
            label: genderLabels.f
          },
          {
            data: males,
            backgroundColor: genderColours.m,
            borderWidth: 1,
            label: genderLabels.m
          }
      ]
    }
  });
}
