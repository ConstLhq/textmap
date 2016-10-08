'use strict';

angular
.module('myApp', ['angularFileUpload', 'ui.bootstrap.contextMenu'])

.factory('geojsonService', ['$http', function geojsonService($http) {
  var resTimeData = {}
  var resEventData = {}
  var resCodeData = {}
  var getData = function(doc_id) {

    return $http.post('/mydoc', {
        doc: doc_id
      })
      .success(function(data) {
        resTimeData = data
      })
      .error(function(data) {
        console.log(data);
        resTimeData = {}
      })
  }
  var getPointDetail = function(event_id) {
    return $http.post('/event', {
        e_id: event_id
      })
      .success(function(data) {
        resEventData = data
      })
      .error(function(data) {
        console.log(data);
        resEventData = {}
      })
  }

  var geoCode = function(loc) {
    return $http.post('/geocode', {
        str: loc
      })
      .success(function(data) {
        resCodeData = data
      })
      .error(function(data) {
        console.log(data);
        resCodeData = {}
      })
  }

  var updateXml = function(qs) {

    return $http.post('/updatexml', qs)
      .success(function(data) {
        //数据已经更新，前端重新请求
        getData(qs.doc_id)
        // geojsonService.getJson()

      })
      .error(function(data) {
        console.log(data);
        resCodeData = {}
      })
  }
  return {
    getData: getData,
    getPointDetail: getPointDetail,
    getJson: function() {
      return resTimeData
    },
    getGeoJson: function() {
      return resEventData
    },
    geoCode: geoCode,
    getGeoCode: function() {
      return resCodeData
    },
    updateXml: updateXml
  };
}])

.controller('upController', ['$scope', 'FileUploader', function($scope, FileUploader) {
    var uploader = $scope.uploader = new FileUploader({
      url: '/dataInput'
    });

    // FILTERS
    uploader.filters.push({
      name: 'filetypeFilter',
      fn: function(item, option) {

        return item.type.split('/')[0] == "text" && item.size < 10 * 1024 * 1024; //small than 10Mb
      }
    });

    uploader.filters.push({
      name: 'customFilter',
      fn: function(item /*{File|FileLikeObject}*/ , options) {
        return this.queue.length < 10;
      }
    });

  }])
  // .controller('tabController', ['$scope', 'geojsonService', '$http', function($scope, geojsonService, $http) {

    //  $scope.current_tag=1
    //  $scope.showTag = function(tag_id){
    //    $scope.current_tag = tag_id;
    //  }
    //  $scope.displayDoc=function(doc_id){
    //   geojsonService.getData(doc_id)
    // }
  // }])

.controller('mapController', ['$scope', 'geojsonService', function($scope, geojsonService) {
  $scope.current_tag = 1
  $scope.parsedXml = "haha"
  $scope.showTimeline = false
  $scope.edits = {
    poiLat: "",
    poiLng: "",
    poiName: "",
    editing: false,
    e_id: "",
    doc_id: ""
  }
  $scope.$on("modifylatlng", function() {
    var value = geojsonService.getGeoCode()
    $scope.edits.poiLat = value.lat
    $scope.edits.poiLng = value.lng
    // $scope.edits.poiName = value.str
      //fail
    if (value.lat == "") {
      angular.element('.leaflet-container').css('cursor', 'crosshair');
      $scope.$emit("startEditing", true)
    }
    //success
    else {
      $scope.$emit("drawMarker")
    }
  })
  $scope.showTag = function(tag_id) {
    $scope.current_tag = tag_id;
  }
  $scope.displayDoc = function(doc_id, sequence) {
    $scope.edits.doc_id = doc_id

    geojsonService.getData(doc_id)
    if (sequence) {
      $scope.showTimeline = true
      $scope.$broadcast("resizeMap")
    } else {
      $scope.showTimeline = false
      $scope.$broadcast("resizeMap")
    }
  }
  $scope.showInEdit = function(e_id) {
    $scope.edits.e_id = e_id
    geojsonService.getPointDetail(e_id)
  }

}])

.directive('map', ['geojsonService', function(geojsonService) {
  return {
    restrict: 'E',
    replace: true,
    template: '<div></div>',
    link: function(scope, element, attrs) {

      var map = L.map(attrs.id, {
        maxZoom: 18,
        minZoom: 4
      }).setView([30.8282, 112.5795], 4);
      var tile;
      L.TileLayer.WebDogTileLayer = L.TileLayer.extend({

        getTileUrl: function(tilePoint) {
          tile = tilePoint
          var urlArgs,
            getUrlArgs = this.options.getUrlArgs,
            modified_s = this._getSubdomain(tilePoint);
          if (getUrlArgs) {
            var urlArgs = getUrlArgs(tilePoint);
            switch (this._getSubdomain(tilePoint)) {
              case 'a':
                modified_s = 0;
                break;
              case 'b':
                modified_s = 1;
                break;
              case 'c':
                modified_s = 2;
                break;
            }
          } else {
            urlArgs = {
              z: tilePoint.z,
              x: tilePoint.x,
              y: tilePoint.y
            };
          }
          return L.Util.template(this._url, L.extend(urlArgs, this.options, {
            s: modified_s
          }));
        }
      });
      L.tileLayer.webdogTileLayer = function(url, options) {
        return new L.TileLayer.WebDogTileLayer(url, options);
      };
      var resize = function(mode) {
        var $map = $('#map');
        if (mode)
          $map.height($(window).height() - $('nav').height() - 256);
        else
          $map.height($(window).height()- $('nav').height());
        map.invalidateSize();
      };
      $(window).on('resize', function() {
        resize(false);
      });
      resize(false);
      scope.$on("resizeMap", function() {
        resize(scope.showTimeline)
      })
      var dem_url = 'http://p{s}.map.gtimg.com/demTiles/{z}/{x_16}/{y_16}/{x}_{y}.jpg',
        sate_url = 'http://p{s}.map.gtimg.com/sateTiles/{z}/{x_16}/{y_16}/{x}_{y}.jpg',
        normal_url = 'http://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0',
        gettile_options = {
          subdomain: '012',
          getUrlArgs: function(tilePoint) {
            return {
              z: tilePoint.z,
              x: tilePoint.x,
              y: Math.pow(2, tilePoint.z) - 1 - tilePoint.y,
              x_16: Math.floor(tilePoint.x / 16),
              y_16: Math.floor((Math.pow(2, tilePoint.z) - 1 - tilePoint.y) / 16)
            };
          }
        };

      // road_layer= L.tileLayer.webdogTileLayer(road_url, gettile_options)
      var sate_layer = L.tileLayer.webdogTileLayer(sate_url, gettile_options)
      var dem_layer = L.tileLayer.webdogTileLayer(dem_url, gettile_options)
      var normal_layer = L.tileLayer.webdogTileLayer(normal_url, gettile_options).addTo(map);
      var layerControl = new L.Control.Layers({
        '标准底图': normal_layer
      });
      layerControl.addTo(map);

      var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);
      layerControl.addOverlay(dem_layer, '地形图');
      layerControl.addOverlay(sate_layer, '卫星图');

      var drawPoint = function(points) {
        var lng = new Array()
        var lat = new Array()
        try {
          scope.markPoints.clearLayers()

          for (var i = 0; i < points.features.length; i++) {
            lng.push(points.features[i].geometry.coordinates[0])
            lat.push(points.features[i].geometry.coordinates[1])
          }

          lng.sort()
          lat.sort()
        } catch (e) {
          console.log(e)
        }

          // console.log(points)

        var geojsonMarkerOptions = {
          radius: 5,
          fillColor: "#ff0000",
          color: "#ff0000",
          weight: 1,
          opacity: 1,
          fillOpacity: 1
        };
        scope.markPoints = L.geoJson(points, {
          pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
          },
          onEachFeature: function(feature, layer) {
            layer.on('click', function() {
              layer.bindPopup(L.HTMLUtils.buildTable(feature.properties), {
                offset: L.point(0, -10)
              });
              layer.openPopup();
            });
          }
        })
        scope.markPoints.addTo(map);
        map.fitBounds([
          [lat[0], lng[0]],
          [lat[lat.length - 1], lng[lng.length - 1]]
        ])
      }
      scope.$watch(geojsonService.getGeoJson, function(value) {
        drawPoint(value.geojson);
        scope.originContent = value.content
        scope.parsedXml = value.xml
        scope.current_tag = 1
        $("#inner_tbl").html(buildTable(value.geojson));
        var node = new PrettyJSON.view.Node({ 
            el:$('#geog'), 
            data:value.geojson
        });
        node.expandAll()

      });

      var drawMarker = function() {
        if (scope.edits.latestMarker != null) {
          map.removeLayer(scope.edits.latestMarker)
        }
        var latlng = L.latLng(scope.edits.poiLat, scope.edits.poiLng)
        scope.edits.latestMarker = new L.marker(latlng, {
          draggable: true
        })
        scope.edits.latestMarker.on('dragend', function() {
          scope.edits.poiLng = scope.edits.latestMarker.getLatLng().lng
          scope.edits.poiLat = scope.edits.latestMarker.getLatLng().lat
          scope.$apply()
        })
        map.addLayer(scope.edits.latestMarker)
      }

      map.on('click', function(e) {
        if (scope.edits.editing) {
          scope.edits.poiLng = e.latlng.lng
          scope.edits.poiLat = e.latlng.lat
          scope.$apply()
          drawMarker()
        }
      })
      scope.$on("startEditing", function(x) {
        scope.edits.editing = true
      })
      scope.$on("editingCancel", function() {
        scope.edits.editing = false
        map.removeLayer(scope.edits.latestMarker)
        scope.edits.latestMarker = null
      })
      scope.$on("drawMarker", function() {
        drawMarker()
      })
      scope.$on("editingQuery", function() {

        geojsonService.geoCode(scope.edits.exInfo)
        scope.$watch(geojsonService.getGeoCode, function(value) {
          if (value) {
            scope.$emit("modifylatlng") //tell mapController

          }
        })
        
      })
      scope.$on("editingOK", function() {
        //先修改xml，然后post更新数据库，然后用返回数据重新绘图

        // var updataedxml = scope.parsedXml
        var qs = scope.edits

        // updataedxml = updataedxml.replace(eval("/" + scope.edits.poiName + "/g"), "<Location lng=" + "'" + scope.edits.poiLng + "'" + " lat=" + "'" + scope.edits.poiLat + "'>" + scope.edits.poiName + "</Location>")
        geojsonService.updateXml(qs)

        scope.edits.editing = false
        map.removeLayer(scope.edits.latestMarker)
        scope.edits.latestMarker = null

      })
    }
  };
}])

.directive('timeLine', ['geojsonService', function(geojsonService) {
  return {
    restrict: 'E',
    replace: true,
    template: '<div></div>',
    link: function(scope, element, attrs) {
      var container = document.getElementById('visualization');
      var items = new vis.DataSet();
      var options = {
        // Set global item type. Type can also be specified for items individually
        // Available types: 'box' (default), 'point', 'range', 'rangeoverflow'
        type: 'point',
        showMajorLabels: false,
        height: 256,
      };

      var timeline = new vis.Timeline(visualization, items, options)
      var onSelect = function(properties) {
        var selected = timeline.getSelection();
        if (selected.length > 0) {
          var item = selected[0]
          scope.showInEdit(items.get(item).e_id)
        }
      };

      // Add a listener to the select event
      timeline.on('select', onSelect);
      var drawTimeLine = function(data) {
        items.clear();
        items.add(data)
        timeline.fit();
      }
      scope.$watch(geojsonService.getJson, function(value) {
        if (value.sequence) {
          drawTimeLine(value.json);
        } else {
          scope.showInEdit(value.json[0].e_id)
        }
      });
    }
  }
}])


.controller('editController', ["geojsonService", "$window",
  '$scope',
  function(geojsonService, $window, $scope) {
    $scope.addLocShow = false

    $scope.menuOptions = [
      ['添加地址', function($itemScope) {
          // Code
        },
        [
          [
            function($itemScope, $event) {
              return "在线匹配：\"" + $window.getSelection().toString() + '"'
            },
            function($itemScope, $event) {

              $scope.addLocShow = true
              $scope.edits.poiName = $window.getSelection().toString()
              $scope.edits.poiLat = 0
              $scope.edits.poiLng = 0
              $scope.edits.exInfo = $window.getSelection().toString()


              geojsonService.geoCode($scope.edits.poiName)
              $scope.$watch(geojsonService.getGeoCode, function(value) {
                if (value) {
                  $scope.$emit("modifylatlng") //tell mapController

                }
              })

            },
            function($itemScope, $event) {
              return $window.getSelection().toString() != "";
            }
          ],
          [
            function($itemScope, $event) {
              return "手动添加：\"" + $window.getSelection().toString() + '"'
            },
            function($itemScope, $event) {

              $scope.addLocShow = true
              $scope.edits.poiName = $window.getSelection().toString()
              $scope.edits.poiLat = 0
              $scope.edits.poiLng = 0
              angular.element('.leaflet-container').css('cursor', 'crosshair');
              $scope.$emit("startEditing", true)
            },
            function($itemScope, $event) {
              return $window.getSelection().toString() != "";
            }
          ]
        ]
      ],
      null, [function($itemScope, $event) {
          return "添加人名\"" + $window.getSelection().toString() + '"'
        },
        function($itemScope, $event) {},
        function($itemScope, $event) {
          return $window.getSelection().toString() != "";
        }
      ],
    ];

    $scope.editingQuery = function() {
      $scope.addLocShow = true
      $scope.$emit("editingQuery")

      angular.element('.leaflet-container').css('cursor', '');

    }

    $scope.editingOK = function() {
      $scope.addLocShow = false
      $scope.$emit("editingOK")
      angular.element('.leaflet-container').css('cursor', '');

    }

    $scope.editingCancel = function() {
      $scope.addLocShow = false
      $scope.$emit("editingCancel", "")
      angular.element('.leaflet-container').css('cursor', '');
    }

     

  }
])

.directive('colorText', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<div style="margin-top:10px" class="content" ng-transclude><p  style="fontsize:20px" context-menu="menuOptions" model="parsedXml"></p></div>',
    link: function(scope, element, attrs) {
      scope.$watch('parsedXml', function(newVal) {
        element.mCustomScrollbar("destroy");
        var content = newVal
          .replace(/<\/?response>/g, '')
          .replace(/<\/?content>/g, '')
          .replace(/\n/g, "")
          .replace(/\\n/g, "")
          .replace(/<time>/g, '<span class="label label-info">')
          .replace(/<\/time>/g, "</span>")
          .replace(/<person>/g, '<span class="label label-success">')
          .replace(/<\/person>/g, '</span>')
          .replace(/<\/Location>/g, '</span>')
          .replace(/<Location.+?>/g, '<span class="label label-primary" ng-click="console.log(123)">')
        element.children().html(content)
        element.mCustomScrollbar({
          theme: "ligth",
          setHeight: 500,
        })
      })


    }
  }
})