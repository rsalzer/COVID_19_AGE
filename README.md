# COVID_19_AGE
See visualisation in action here: https://rsalzer.github.io/COVID_19_AGE

Showing Age-Data, published by the Swiss Federal Office of Health FOPH (Bundesamt für Gesundheit BAG).
Till 2020-03-24 the BAG only published diagrams. This project digitized them.
From the 2020-03-24 on, a scraper is getting an Excel-File and parses it to a csv.

## New Workflow
* Get BAG-Excelfile
* Parse it
* Create csv's

## Old Workflow
* Get Chart-Image from BAG (<a href="https://twitter.com/BAG_OFSP_UFSP">Twitter</a>)
* Interpret the image using <a href="https://automeris.io/WebPlotDigitizer/">WebPlotDigitizer</a>
* Create csv's

## Exampleimage (Old)
<img src="https://github.com/rsalzer/COVID_19_AGE/blob/master/bagdiagrams/03-20.jpg" alt="exampleimage" width="500"/>
