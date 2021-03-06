var maps = {};

var mbgljsMap = new mapboxgl.Map({
  attributionControl: false,
  container: 'map-mbgljs',
  style: 'https://openmaptiles.github.io/klokantech-basic-gl-style/style-cdn.json',
  zoom: 2
});
maps['mbgljs'] = {
  getPos: function() {
    return [mbgljsMap.getCenter().lng, mbgljsMap.getCenter().lat, mbgljsMap.getZoom() + 1];
  },
  setPos: function(pos) {
    mbgljsMap.setCenter([pos[0], pos[1]]);
    mbgljsMap.setZoom(pos[2] - 1);
  }
};

var leafletMap = L.map('map-leaflet', {zoomControl: false, attributionControl: false}).setView([0, 0], 2);
L.tileLayer('https://klokantech-0.tilehosting.com/styles/basic/rendered/{z}/{x}/{y}.png?key=tXiQqN3lIgskyDErJCeY', {
  maxZoom: 18
}).addTo(leafletMap);

maps['leaflet'] = {
  getPos: function() {
    return [leafletMap.getCenter().lng, leafletMap.getCenter().lat, leafletMap.getZoom()];
  },
  setPos: function(pos) {
    leafletMap.setView([pos[1], pos[0]], pos[2], {animate: false});
  }
};

var layer = new ol.layer.VectorTile({
  source: new ol.source.VectorTile({
    attributions: '© <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
      '© <a href="http://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>',
    format: new ol.format.MVT(),
    tileGrid: ol.tilegrid.createXYZ({tileSize: 512, maxZoom: 14}),
    tilePixelRatio: 8,
    url: 'https://free-{0-3}.tilehosting.com/data/v3/{z}/{x}/{y}.pbf?key=tXiQqN3lIgskyDErJCeY'
  })
});
var viewOl = new ol.View({
  center: [0, 0],
  zoom: 0,
  minZoom: 0,
  maxZoom: 18
});
var mapOl = new ol.Map({
  target: 'map-ol',
  controls: [],
  view: viewOl
});

fetch('https://openmaptiles.github.io/klokantech-basic-gl-style/style-cdn-undecorated.json').then(function(response) {
  response.json().then(function(glStyle) {
    glStyle.layers.forEach(function(layer) {
      if(layer.layout && layer.layout['text-font']) {
        var newFont = layer.layout['text-font'][0].split(' ');
        newFont = 'Open Sans '+newFont[newFont.length-1];
        layer.layout['text-font'] = [newFont];
      }
    });
    olms.applyStyle(layer, glStyle, 'openmaptiles').then(function () {
      mapOl.addLayer(layer);
    });
    var bglayer = glStyle.layers.find(function(l) {
      return l.type === 'background';
    });
    if(bglayer && bglayer.paint && bglayer.paint['background-color']) {
      var bgcolor = bglayer.paint['background-color'];
      document.getElementById('map-ol').style.backgroundColor = bgcolor;
    }
  });
});
maps['ol'] = {
  getPos: function() {
    var center = ol.proj.toLonLat(viewOl.getCenter());
    return [center[0], center[1], Math.log((Math.PI * 6378137 * 2 / 256) / viewOl.getResolution()) / Math.LN2];
  },
  setPos: function(pos) {
    var center = ol.proj.fromLonLat(pos);
    viewOl.setCenter(center);
    viewOl.setResolution((Math.PI * 6378137 * 2 / 256) / Math.pow(2, pos[2]));
  }
};

var mapTangram = L.Mapzen.map('map-tangram', {
  zoomControl: false,
  attributionControl: false,
  scene: '/js/tangram-style.yaml'
});
mapTangram.setView([0, 0], 0);

maps['tangram'] = {
  getPos: function() {
    return [mapTangram.getCenter().lng, mapTangram.getCenter().lat, mapTangram.getZoom()];
  },
  setPos: function(pos) {
    mapTangram.setView([pos[1], pos[0]], pos[2], {animate: false});
  }
};


var activeId = 'mbgljs';
function switchMap(id) {
  var oldPos = maps[activeId].getPos();
  var active = document.querySelector('.map.active');
  var activeSwitch = document.querySelector('.map-switch.active');
  if (active) {
    active.className = 'viewers map';
  }
  if (activeSwitch) {
    activeSwitch.className = 'map-switch';
  }
  var newActive = document.getElementById('map-' + id);
  newActive.className = 'viewers map active';
  var newActiveSwitch = document.getElementById('map-switch-' + id);
  newActiveSwitch.className = 'map-switch active';
  activeId = id;
  maps[activeId].setPos(oldPos);
  document.querySelector('#navbar-top').className = id;
}
