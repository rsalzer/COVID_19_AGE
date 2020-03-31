const https = require('https');
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');


const bagExcelLocation = "https://www.bag.admin.ch/dam/bag/de/dokumente/mt/k-und-i/aktuelle-ausbrueche-pandemien/2019-nCoV/covid-19-datengrundlage-lagebericht.xlsx.download.xlsx/200325_Datengrundlage_Grafiken_COVID-19-Bericht.xlsx";

var myArgs = process.argv.slice(2);
switch (myArgs[0]) {
case 'download':
    console.log("Downloading the BAG-File");
    downloadFile();
    break;
case 'parse':
    console.log('Parsing temp.xlsx');
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
  var data = deaths.splice(5,10);

  var deaths = [];
  data.forEach((item, i) => {
    if(item.B!=null) {
      deaths.push({
        age: item.A,
        m: item.B,
        f: item.C
      })
    }
  });
  console.log("Deaths:");
  console.log(deaths);

  var hospit = result["COVID19 Altersverteilung Hospit"];
  data = hospit.splice(5,20);

  var hospitalised = [];
  data.forEach((item, i) => {
    if(item.B!=null) {
      hospitalised.push({
        age: item.A,
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
        age: item.A,
        m: item.B,
        f: item.E
      });
      incidences.push({
        age: item.A,
        m: item.D,
        f: item.G
      });
    }
  });
  console.log("Cases:");
  console.log(cases);
  console.log("Incidences:");
  console.log(incidences);

  //fs.unlink("temp.xlsx", function() { console.log("deleted") });
}
