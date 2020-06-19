const https = require('https');
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');


const bagExcelLocation = "https://www.bag.admin.ch/dam/bag/de/dokumente/mt/k-und-i/aktuelle-ausbrueche-pandemien/2019-nCoV/covid-19-datengrundlage-lagebericht.xlsx.download.xlsx/200325_Datengrundlage_Grafiken_COVID-19-Bericht.xlsx";
const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

const ageLabels = ["0-9","10-19","20-29","30-39","40-49","50-59","60-69","70-79","80+"];
var appendToFiles = false;
listFiles();

function listFiles() {
    fs.readdir('../bagfiles', function(err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        var header = "date";
        cantons.forEach(function(c) {
          header += ","+c;
        });
        fs.writeFileSync('../data/casesPerCanton.csv', header);

        var i=0;
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            if(file.endsWith(".xlsx")) {
                var obj = parseExcel(file);
                //console.log(obj);
                var csvRow = makeCantonCSVRow(obj);
                //console.log(csv);
                fs.appendFileSync('../data/casesPerCanton.csv', '\r\n'+csvRow);
            }
        });
//        console.log(cantons);//parseExcel(files[20]);
    });
}


function parseExcel(file) {

  console.log("Parsing Date: " + file.substring(0, file.length-5));

  const result = excelToJson({
      sourceFile: '../bagfiles/'+file
  });
  var casesPerCantons = result["COVID19 Kantone"];
  var data = casesPerCantons.splice(4,29);

  var dateObj = {};
  var date = file.substring(0, file.length-5);
  var dateObj = {};
  dateObj.date = date;

  data.forEach((item, i) => {
    if(item.B!=null && item.A!=null && item.A.length<3) {
      var singleCanton = {};
      singleCanton.cases = item.B,
      singleCanton.incidences = item.C
      dateObj[item.A.replace(/ /g,"")] = singleCanton;
    }
  });

  return dateObj;
}

function makeCantonCSVRow(obj) {
  var csv = "";
  csv += obj.date;
  for(var i=0; i<cantons.length; i++) {
    var canton = cantons[i];
    var cantonObj = obj[canton];
    if(cantonObj!=null && cantonObj.cases!=null) {
      csv += ","+cantonObj.cases;
    }
    else {
      csv += ",";
    }
  }
  return csv;
}
