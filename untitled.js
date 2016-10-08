var turf = require('turf');
var fs = require('fs');


var Points = fs.readFileSync('./message.geojson');

Points = JSON.parse(Points);

console.log(Points)

var breaks = [1, 2, 3, 4, 5, 6, 7, 8]

var isolines = turf.isolines(Points, 'unit_price', 30, breaks);
isolines.features.forEach(function(feature) {
	feature.properties["stroke"] = "#25561F";
	feature.properties["stroke-width"] = 2;
	feature.properties["stroke-opacity"] = .5;
});

fs.writeFileSync('./hull.geojson', JSON.stringify(isolines));

console.log('saved!');