var fs = require('fs')
var GeoJSON = require('geojson')
var turf = require('turf');

fs.readFile('./woaiwojia_resold_2015_1104.txt', {
			encoding: 'utf-8'
		}, function(err, data) {
			if (err) throw err;
			var _data =[] 
			data.split(/\r?\n/).forEach(function (line){
				var temp=JSON.parse(line)
				temp["longitude"]=parseFloat(temp["longitude"])
				temp["latitude"]=parseFloat(temp["latitude"])
				_data.push(temp)
			} )
			// console.log(_data)
			GeoJSON.parse(_data, {
				Point: ['latitude', 'longitude'],
				include: ["unit_price"]
			}, function(geojson) {
				// fs.writeFile('message.geojson', JSON.stringify(geojson), (err) => {
				// 	if (err) throw err;
				// 	console.log('It\'s saved!');
				// });

				var breaks = [1, 2, 3, 4, 5]

				var isolines = turf.isolines(geojson, 'unit_price', 100, breaks);
				isolines.features.forEach(function(feature) {
					
					feature.properties["stroke-width"] = 1;
					feature.properties["stroke-opacity"] = 1;
					switch(feature.properties.unit_price){
						case 1: 
							feature.properties["stroke"]="#3ADF00"
							break;
						case 0:
							feature.properties["stroke"]="#74DF00"
							break;
						case 2:
							feature.properties["stroke"]="#A5DF00"
							break;
						case 0: 
							feature.properties["stroke"]="#D7DF01"
							break;
						case 3: 
							feature.properties["stroke"]="#DBA901"
							break;
						case 0: 
							feature.properties["stroke"]="#DF7401"
							break;
						case 4: 
							feature.properties["stroke"]="#DF3A01"
							break;
						case 5: 
							feature.properties["stroke"]="#DF0101"
							break;
					}
				});

				fs.writeFileSync('./hull.geojson', JSON.stringify(isolines));

				console.log('saved!');
			});
		})