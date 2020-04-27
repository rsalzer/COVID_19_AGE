const https = require('https');
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');


const bagExcelLocation = "https://www.bag.admin.ch/dam/bag/de/dokumente/mt/k-und-i/aktuelle-ausbrueche-pandemien/2019-nCoV/covid-19-datengrundlage-lagebericht.xlsx.download.xlsx/200325_Datengrundlage_Grafiken_COVID-19-Bericht.xlsx";

const ageLabels = ["0-9","10-19","20-29","30-39","40-49","50-59","60-69","70-79","80+"];
var appendToFiles = false;

var myArgs = process.argv.slice(2);
switch (myArgs[0]) {
case 'download':
    console.log("Downloading the BAG-File");
    downloadFile();
    break;
case 'parse':
    console.log('Parsing temp.xlsx');
    if(myArgs[1] == "append") {
      appendToFiles = true;
    }
    parseExcel();
    break;
default:
    console.log('Sorry, that is not something I know how to do.');
}

function downloadFile() {
  const file = fs.createWriteStream("temp.xlsx");
  const request = https.get(bagExcelLocation, function(response) {
      response.pipe(file);

      file.on('finish', function() {
        console.log("Finish downloading");
        //parseExcel();
      });
  });
}

function parseExcel() {
  const result = excelToJson({
      sourceFile: 'temp.xlsx'
  });
  var deaths = result["COVID19 Altersverteilung TodF"];
  var data = deaths.splice(4,10);

  var deaths = [];
  data.forEach((item, i) => {
    if(item.B!=null || item.C!=null) {
      deaths.push({
        age: item.A.replace(/ /g,""),
        m: item.B,
        f: item.C
      })
    }
  });
  console.log("Deaths:");
  console.log(deaths);

  var hospit = result["COVID19 Altersverteilung Hospit"];
  data = hospit.splice(4,20);

  var hospitalised = [];
  data.forEach((item, i) => {
    if(item.B!=null) {
      hospitalised.push({
        age: item.A.replace(/ /g,""),
        m: item.B,
        f: item.C
      })
    }
  });
  console.log("Hospitalised:");
  console.log(hospitalised);

  var casessheet = result["COVID19 Altersverteilung"];
  data = casessheet.splice(5,20);

  var cases = [];
  var incidences = [];
  data.forEach((item, i) => {
    if(item.B!=null) {
      cases.push({
        age: item.A.replace(/ /g,""),
        m: item.B,
        f: item.E
      });
      incidences.push({
        age: item.A.replace(/ /g,""),
        m: item.D,
        f: item.G
      });
    }
  });
  console.log("Cases:");
  console.log(cases);
  console.log("Incidences:");
  console.log(incidences);

  var totals = result["COVID19 Zahlen"];
  data = totals.splice(5);
  var total = data.reduce(function(acc, val) { return acc + val.B; }, 0);
  console.log("BAG Total: "+total);

  var dateString = totals[0].A
  var length = dateString.length;;
  var date = dateString.substring(length-20,length-10);
  console.log("Date: " + date);

  var allAgesDetailCSVRow = makeCSVRow(cases, date);
  allAgesDetailCSVRow+= ","+total; //Add BAG-Total
  console.log("All ages details CSV: "+allAgesDetailCSVRow);
  var deathCSVRow = makeCSVRow(deaths, date);
  console.log("Deaths CSV: "+deathCSVRow);
  var incidenceCSVRow = makeCSVRow(incidences, date);
  console.log("Insidences CSV: "+incidenceCSVRow);
  var hospitalicedCSVRow = makeCSVRow(hospitalised, date);
  console.log("Hospitalised CSV: "+hospitalicedCSVRow);
  //fs.unlink("temp.xlsx", function() { console.log("deleted") });

  if(appendToFiles) {
    console.log("** Checking if date already exists **");
    fs.readFile('../data/deaths.csv', 'utf-8', function(err, data) {
        if (err) throw err;

        var lines = data.trim().split('\n');
        var lastLine = lines.slice(-1)[0];

        var fields = lastLine.split(',');
        var fileDate = fields[0];

        console.log("FileDate = "+fileDate);
        console.log("Date of BAG = "+date);

        if(fileDate==date) {
          console.log("No new data ... doing nothing!");
          return;
        }

        console.log("New Data ... lets append!");
        console.log("** Appending to files **");
        fs.appendFileSync('../data/deaths.csv', '\r\n'+deathCSVRow);
        fs.appendFileSync('../data/incidences.csv', '\r\n'+incidenceCSVRow);
        fs.appendFileSync('../data/allagesdetails.csv', '\r\n'+allAgesDetailCSVRow);
        fs.appendFileSync('../data/hospitalised.csv', '\r\n'+hospitalicedCSVRow);
        console.log("** Done appending **");

        var oldPath = 'temp.xlsx'
        var newPath = '../bagfiles/'+date+'.xlsx'

        fs.rename(oldPath, newPath, function (err) {
          if (err) throw err
          console.log('Successfully renamed temp.xlsx - AKA moved!')
        })
    });
  }
}

function makeCSVRow(array, date) {
  var csv = "";
  csv += date;
  ageLabels.forEach((item, i) => {
    var singleCase = array.filter(function(d) { if(d.age==item) return d});
    if(singleCase.length>0) {
      csv += ","+singleCase[0].f;
    }
    else {
      csv += ",0";
    }
  });
  ageLabels.forEach((item, i) => {
    var singleCase = array.filter(function(d) { if(d.age==item) return d});
    if(singleCase.length>0) {
      csv += ","+singleCase[0].m;
    }
    else {
      csv += ",0";
    }
  });
  return csv;
}
