/*
 * Mapping
 * 
 */  
 // Revised by Larry Biehl on 04/12/2017; added county search capability.
 // Revised by Larry Biehl on 09/16/2019; set Terrain as default background layer. Bing map not work; usage over the limit.

jQuery(document).ready(function(jq){
	var $ = jq;
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
	{
		mapping.mobileUser = true;
		mapping.smallScreen = true;
	}

	if(/iPad/i.test(navigator.userAgent))
	{
		mapping.smallScreen = false;
	}

	mapping.init();
	mappingSearch.addSearchBindings();
	$('#permalink').click(mapping.createPermalink);

	// Focus on the search input text box
	$('#search_ol input').focus();
});

// Define the data and methods for the map.
var mapping = new Object();

mapping.searchTimeout = null;
mapping.states = new Array(
    {'name':'Illinois', 'abbrev':'IL'},         {'name':'Indiana', 'abbrev':'IN'},         {'name':'Iowa', 'abbrev':'IA'},             
    {'name':'Kansas', 'abbrev':'KS'},           {'name':'Missouri', 'abbrev':'MO'},        {'name':'Michigan', 'abbrev':'MI'},
    {'name':'Minnesota', 'abbrev':'MN'},        {'name':'Nebraska', 'abbrev':'NE'},        {'name':'North Dakota', 'abbrev':'ND'},
    {'name':'Ohio', 'abbrev':'OH'},             {'name':'South Dakota', 'abbrev':'SD'},    {'name':'Wisconsin', 'abbrev':'WI'}
);

// Valid states
mapping.validStates = new Array(
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Missouri',
    'Michigan',
    'Minnesota',
    'Nebraska',
    'North Dakota',
    'Ohio',
    'South Dakota',
    'Wisconsin'
);

// Names for the crd regions
mapping.crdNames = new Array(
   'NorthWest',			'NorthEast',		'West', 			'Central',			'East',		'West SouthWest',	'East SouthEast',	'SouthWest',		'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest',		'SouthCentral',	'SouthEast',
   'NorthWest',			'WestCentral',		'SouthWest',	'NorthCentral',	'Central',	'SouthCentral',	'NorthEast', 		'EastCentral', 	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest',		'SouthCentral',	'SouthEast',
   'Upper Peninsula',	'NorthWest',		'NorthEast', 	'WestCentral',		'Central',	'EastCentral',		'SouthWest',		'SouthCentral',	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast',
   'NorthWest',			'North',				'NorthEast',	'Does not exist',	'Central',	'East',				'SouthWest', 		'South',				'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast',
   'NorthWest',			'NorthCentral',	'NorthEast',	'WestCentral',		'Central',	'EastCentral',		'SouthWest', 		'SouthCentral',	'SouthEast'
);

mapping.extent4326 = [-104.140,35.866, -80.441, 49.521];
mapping.extent = [];
mapping.geolocation = null;

mapping.trackingGeolocation = false;

mapping.map = null;   
mapping.view = null;
mapping.mobileUser = false;
mapping.smallScreen = false;

mapping.infoControl;

mapping.selectedLocationPoint = null;
mapping.pointSelected = false;

// Location info pop
mapping.popOverlay = null;
mapping.popContainer = null;
mapping.popContent = null;
mapping.popCloser = null;

mapping.stateLayer;
mapping.cmzLayer;
mapping.countyLayer;

// Used for indicating that layer has been loaded.
mapping.stateLayerLoaded = false;
mapping.cmzLayerLoaded = false;
mapping.countyLayerLoaded = false;

mapping.layerLoadComplete = false;

mapping.clickLocationInteraction = null;

mapping.dragPanHandler = null;

// Initialize map and all supporting options.
mapping.init = function()
{
	// State Layer
	var state_style = new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(170, 170, 170, 0.1)'
		}),
		stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0.6)',
			width: 2.5
		}),
	});

	var state_layer_source = new ol.source.Vector({
		url: '/app/site/groups/3048/components/com_purdue_gdd/assets/data/U2U_States_Level4.geojson',
		format: new ol.format.GeoJSON()
	});

	this.stateLayer = new ol.layer.Vector({
		title: 'States',
		source: state_layer_source,
		style: state_style,
		selectable: false,
		switchable: true,
	});

	// Corn Maturity Zone (cmz) Layer
	var cmz_style = new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(0, 0, 0, 0)',
		}),
		stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0)',
			width: 0
		}),
	});

	var cmz_layer_source  = new ol.source.Vector({
		url: '/app/site/groups/3048/components/com_purdue_gdd/assets/data/u2u_corn_maturity_zones.geojson',
		format: new ol.format.GeoJSON()
	});

	// Options for Vector Layers
	this.cmzLayer = new ol.layer.Vector({
		title: 'Crop Reporting Districts',
		source: cmz_layer_source,
		style: cmz_style,
		selectable: true,
		switchable: false,
		visible: true
	});

	// County Layer
	var county_style = new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(170, 170, 170, 0.2)'
		}),
		stroke: new ol.style.Stroke({
			color: 'rgba(68, 68, 68, 1)',
			width: 1
		}),
	});

	var county_layer_source  = new ol.source.Vector({
		url: '/app/site/groups/3048/components/com_purdue_gdd/assets/data/U2U_KY_TN_County_Level4.geojson',
		format: new ol.format.GeoJSON()
	});

	// Options for Vector Layers
	this.countyLayer = new ol.layer.Vector({
		title: 'Counties',
		source: county_layer_source,
		style: county_style,
		selectable: true,
		switchable: true,
	});


	// Definition for all layers available
	var layers = [
		// Layer Grouping for Base Maps
		new ol.layer.Group({
			'title': 'Base Layer',
			layers: [

			/*	new ol.layer.Group({
					title: 'AerialWithLabels',
					type: 'base',
					visible: false,
					layers: [
						new ol.layer.Tile({
						source: new ol.source.MapQuest({layer: 'sat'})
						}),
						new ol.layer.Tile({
						source: new ol.source.MapQuest({layer: 'hyb'})
						})
					]
				}),*/
				
				new ol.layer.Tile({
					title: 'Bing Roads',
					type: 'base',
					visible: false,
					switchable: true,
					source: new ol.source.BingMaps({
						key: 'Askdx_lFV9Hk0nAuX7vx_o8pxreGhHYcjAXukeT70al4RMSaK2eBQ-3eBYdZ00CZ',
						imagerySet: 'Road',
					}),
				}),
				new ol.layer.Tile({
					title: 'Bing Hybrid',
					type: 'base',
					visible: false,
					switchable: true,
					source: new ol.source.BingMaps({
						key: 'Askdx_lFV9Hk0nAuX7vx_o8pxreGhHYcjAXukeT70al4RMSaK2eBQ-3eBYdZ00CZ',
						imagerySet: 'AerialWithLabels'
					})
				}),
				new ol.layer.Tile({
					title: 'Bing Satellite',
					type: 'base',
					visible: false,
					switchable: true,
					source: new ol.source.BingMaps({
						key: 'Askdx_lFV9Hk0nAuX7vx_o8pxreGhHYcjAXukeT70al4RMSaK2eBQ-3eBYdZ00CZ',
						imagerySet: 'Aerial'
					})
				}),
				new ol.layer.Tile({
					title: 'Terrain',
					type: 'base',
					visible: true,
					switchable: true,
					source: new ol.source.Stamen({
						layer: 'terrain'
					})
				}),
				/*
				new ol.layer.Tile({
					title: 'MapQuest Roads',
					type: 'base',
					visible: false,
					switchable: true,
					source: new ol.source.MapQuest({layer: 'osm'})
				}),
				new ol.layer.Tile({
					title: 'MapQuest Satellite',
					type: 'base',
					visible: false,
					switchable: true,
					source: new ol.source.MapQuest({layer: 'sat'})
				}),
				*/
			]
		}),
		// Layer Grouping for Overlays
		new ol.layer.Group({
			title: 'Overlays',
			layers: [
				this.countyLayer,
				this.cmzLayer,
				this.stateLayer
			]
		})
	];

	// Bind pop variables to html elements
	this.bindLocationPop();
	
	// Create pop overlay element
	this.popOverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
		element: mapping.popContainer,
		autoPan: false,
	}));


	// Define the map view: Extents, Zoom, and Center
	mapping.extent = ol.proj.transformExtent(mapping.extent4326, 'EPSG:4326', 'EPSG:3857');
	var center = ol.extent.getCenter(mapping.extent);
	var zoom = 5;

	// Loading from permalink, which a combination of zoom level and coordinates
	if (window.location.hash !== '')
	{
		// try to restore center, zoom-level and rotation from the URL
		var hash = window.location.hash.replace('#map=', '');
		var parts = hash.split('/');
		if (parts.length === 3)
		{
			zoom = parseInt(parts[0], 10);
			var center4326 = [
				parseFloat(parts[1]),
				parseFloat(parts[2])
			];
			// Center is stored in EPSG:4326 since this is user readable, convert to local coordinates.
			center = ol.proj.transform(center4326, 'EPSG:4326', 'EPSG:3857');

			// Turn initial geolocation off (on load)
			mapping.trackingGeolocation = false;
		}
	}

	this.view = new ol.View({
		center: center,
		zoom: zoom,
		minZoom: 5,
		maxZoom: 12,
		extent: mapping.extent,
	});

	var interactions = ol.interaction.defaults({
		altShiftDragRotate: false,
		pinchRotate: false,
		dragZoom: false,
		// Initially, Dragging to pan is disabled for zoomed out view
		dragPan: true,
	});

	var show_zoom = true;

	if (mapping.mobileUser)
	{
		show_zoom = false;
	}

	// Visible map control
	var controls = ol.control.defaults({
		zoom: show_zoom,
		rotate: false,
		attribution: true,
		attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
			collapsible: false
		})
	});

	var span_node = document.createElement('span');

	if (!mapping.mobileUser)
	{
		controls.extend([
			new ol.control.ZoomToExtent({
				extent: mapping.extent,
				label: span_node,
			}),
			new ol.control.MousePosition({
				projection: 'EPSG:4326',
				coordinateFormat: function(coordinate){
					return 'Cursor Location: ' + ol.coordinate.format(coordinate, '{y}, {x}', 4);
				}
			}),
		]);
	}

	
	
	// Create the map
	this.map = new ol.Map({
		target: 'map_element',
		layers: layers, 
		view: this.view,
		overlays: [this.popOverlay],
		interactions: interactions,
		controls: controls,
	});

	// Preserve DragPan Interaction for later modifications
	var interaction_array = this.map.getInteractions().getArray();
	this.dragPanHandler = interaction_array.filter(function(interaction){
	  return interaction instanceof ol.interaction.DragPan;
	})[0];

	if (zoom <= 5)
	{
		this.dragPanHandler.setActive(false);
	}

	// Add vrious contols and interactions
	this.addLayerInteractions();
	this.addLayerControl();

	this.addGeolocateControl();
	
	// Contrain the extents durring pan
	this.view.on('change:resolution', this.constrainPan);
	this.view.on('change:center', this.constrainPan);

	// If pop is open, keep selected location at center
	this.view.on('change:resolution', this.centerPop);

	county_layer_source.once('change', function(e){
		mapping.layerLoadSync(1);	
		});
	/*
	county_layer_source.on('change', function(e){
		// Fire initial Geolocate only after counties are loaded.
		// If hash for location is in url, do not geolocate on load.
		if(county_layer_source.getState() == 'ready' && window.location.hash == '')
		{
			mapping.geolocation.setTracking(false);
			mapping.geolocation.setTracking(true);
		}
	});
	*/
	cmz_layer_source.once('change', function(e){
		mapping.layerLoadSync(2);
	});
	
	state_layer_source.once('change', function(e){
		mapping.layerLoadSync(3);
	});
}

// Run initial geolocation only if both the countyLayer and the cmzLayer have been loaded.
// Both of the countyLayer and cmzLayer run this function on state change, so check if both are ready.
mapping.layerLoadSync = function(layerCode)
{
	// If hash for location is in url, do not geolocate on load.
	if (window.location.hash != '')
	{
		return;
	}

	// Only need to do this once.
	if (mapping.layerLoadComplete)
	{
		return;
	}
	
	if (layerCode == 1)
		{
		mapping.countyLayerLoaded = true;
		//console.log ("layerCode = 1");
		}
		
	else if (layerCode == 2)
		{
		mapping.cmzLayerLoaded = true;
		//console.log ("layerCode = 2");
		}
		
	else if (layerCode == 3)
		{
		mapping.stateLayerLoaded = true;
		//console.log ("layerCode = 3");
		}
	
	// Fire initial Geolocate only after layers are loaded.
	// 8/18/2016: Note that the logic of using getState does not work. getState always return
	// 'ready' for all layers even if not all have called this routine.
//	if(mapping.countyLayer.getSource().getState() === 'ready' && 
//				mapping.cmzLayer.getSource().getState() === 'ready' && 
//							mapping.stateLayer.getSource().getState() === 'ready')
	if (mapping.countyLayerLoaded && mapping.cmzLayerLoaded && mapping.stateLayerLoaded)
	{
		mapping.layerLoadComplete = true;
		mapping.geolocation.setTracking(false);
		mapping.geolocation.setTracking(true);
	}
}

// Pop up overlay variables.
mapping.bindLocationPop = function()
{
	this.popContainer = document.getElementById('popup');
	this.popContent = document.getElementById('popup-content');
	this.popCloser = document.getElementById('popup-closer');

	/**
	 * Add a click handler to hide the popup.
	 * @return {boolean} Don't follow the href.
	 */
	this.popCloser.onclick = function()
	{
		mapping.deselectLocation();
		return false;
	};
}

// Location no longer selected.
mapping.deselectLocation = function()
{
	mapping.pointSelected = false;
	
	// Remove selections from the interaction
	this.clickLocationInteraction.getFeatures().clear();

	mapping.closePop();
}

// Close (or blur) pop up overlay.
mapping.closePop = function()
{
	mapping.popOverlay.setPosition(undefined);
	mapping.popCloser.blur();
}

// Pan map to specific coordinate with animation.
mapping.panToCoordinates = function(coordinates)
{
	var pan = ol.animation.pan({
		duration: 500,
		source: /** @type {ol.Coordinate} */ (mapping.view.getCenter())
	});
	this.map.beforeRender(pan);
	this.view.setCenter(coordinates);
}

// See http://stackoverflow.com/questions/27200086/restrict-pan-outside-wms-extent-in-openlayers3
// Proper contraint method in ol still needs implementation: https://github.com/openlayers/ol3/pull/2777
mapping.constrainPan = function(evt)
{
	var zoom_level = mapping.view.getZoom();

    // No Panning at the the most zoomed-out level.
	if (zoom_level == 5)
	{
		mapping.dragPanHandler.setActive(false);
		if (evt.type == 'change:resolution')
		{
			mapping.view.setCenter(ol.extent.getCenter(mapping.extent));
		}
		return;
	}

	mapping.dragPanHandler.setActive(true);

   /*
   	var currentExtent = mapping.map.getView().calculateExtent(mapping.map.getSize());
	var currentCenter =  ol.extent.getCenter(currentExtent);
    var center = ol.extent.getCenter(mapping.extent);

    var delta;
    var adjust = false;
    if ((delta = mapping.extent[0] - visible[0]) > 0){
        adjust = true;
        centre[0] += delta;
    } else if ((delta = mapping.extent[2] - visible[2]) < 0){
        adjust = true;
        centre[0] += delta;
    }
    if ((delta = mapping.extent[1] - visible[1]) > 0){
        adjust = true;
        centre[1] += delta;
    } else if ((delta = mapping.extent[3] - visible[3]) < 0){
        adjust = true;
        centre[1] += delta;
    }
    if (adjust){
        mapping.view.setCenter(centre);
    }
    */
};

// If a Location pop is open (location selected), make sure it stays centered when zooming.
mapping.centerPop = function(evt)
{
	var zoom_level = mapping.view.getZoom();

	if (zoom_level > 5 && mapping.pointSelected)
	{
		mapping.view.setCenter(mapping.selectedLocationPoint);
	}
};

// Bind various click and hover interactions to map layers.
mapping.addLayerInteractions = function()
{
	// Map interaction for click
	this.clickLocationInteraction = new ol.interaction.Select({
		condition: ol.events.condition.singleClick,
		// Select multiple layers
		multi: true,
		// Only fire if layer is selectable (countyLayer, cmzLayer)
		layers: function(layer){
			return layer.get('selectable') == true;
		},
	});

	this.map.addInteraction(this.clickLocationInteraction);
	this.clickLocationInteraction.on('select', this.selectLocation, this);
	
	// Change cursor on map drag
	this.map.on('pointerdrag', function(evt){
		mapping.map.getTargetElement().style.cursor = 'move';
	});
	
	// Revert cursor on completion of map drag
	this.map.on('pointerup', function(evt){
		mapping.map.getTargetElement().style.cursor ='default';
	});
}

// Add third party layer switcher.
mapping.addLayerControl = function()
{
	/* Layer Switcher: External Library 
	 * https://github.com/walkermatt/ol3-layerswitcher
	 */
	var layer_switcher = new ol.control.LayerSwitcher({
		tipLabel: 'Legend'
	});

	this.map.addControl(layer_switcher);

	// Remove Hover
	var switcher_control = document.getElementsByClassName('layer-switcher');
	Array.prototype.forEach.call(switcher_control, function(control){
		control.onmouseover = null;
		control.onmouseout = null;

		// Child Buttons, this can change if ol3-layerswitcher changes the structure of it's generated html
		control.firstChild.onclick = function(e){
			var div = control.getElementsByClassName('panel')[0];
			var styles = window.getComputedStyle(div, null);
			if (styles.display === 'block')
			{
				layer_switcher.hidePanel();
			}
			else
			{
				layer_switcher.showPanel();
			}

			e.preventDefault();
		};

	});
}

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
mapping.GeolocateControl = function(opt_options)
{
	var options = opt_options || {};
	var button = document.createElement('button');
	button.id = 'geolocate-control';
	var this_ = this;
	var handleGeolocate = function(e)
	{
	// Make sure tracking is off first, then flip back on.
		mapping.geolocation.setTracking(false);
		mapping.geolocation.setTracking(true);
	};

	button.addEventListener('click', handleGeolocate, false);
	button.addEventListener('touchstart', handleGeolocate, false);

	var element = document.createElement('div');
	element.className = 'ol-geolocate ol-unselectable ol-control';
	// Hide this button for the mobile user
	if (mapping.mobileUser)
	{
		element.className += ' hidden';
	}
	element.appendChild(button);

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});

};

ol.inherits(mapping.GeolocateControl, ol.control.Control);

// Occurs when a new location is retrieved by geolocation
// By default, geolocation is set to track the user, which is not needed here, so we stop tracking when
// coordinates are received. Tracking is turned back on if the user hits the geolocate button.
mapping.geolocateChangePosition = function()
{
	// Just return if the layer loading is not complete.
	if (!mapping.layerLoadComplete) {
		return; }
		
	var coordinates = mapping.geolocation.getPosition();

	// Stop tracking after coordinates are retrieved, else it will keep getting point
	mapping.geolocation.setTracking(false);

	if (ol.extent.containsCoordinate(mapping.extent, coordinates))
	{
		mapping.geoLocationPop(coordinates);
	}
	else
	{
		alert("There is no data for the selected location. Select location within the grayed area. (1)");
	}
}

// Add the geolocation control to the map interface.
mapping.addGeolocateControl = function()
{
	this.map.addControl(new mapping.GeolocateControl);

    // Add Geolocation handlers
	this.geolocation = new ol.Geolocation({
		projection: this.view.getProjection(),
		tracking: mapping.trackingGeolocation
	});

	this.geolocation.on('error', function(error){
		var message = 'There was an error retrieving your position.'
		alert(message);
		console.log(error);
		this.geolocateChangePosition;
	});

	this.geolocation.on('change:position', this.geolocateChangePosition);
}

mapping.geoLocationPop = function(coordinates){
	//Clear existing feature selections
	mapping.deselectLocation();

	geo_event = {};
	geo_event.mapBrowserEvent = {};
	geo_event.mapBrowserEvent.coordinate = coordinates;

	var cmz_features = mapping.cmzLayer.getSource().getFeaturesAtCoordinate(coordinates);
	if (cmz_features.length == 0)
	{
		alert("There is no corn maturity data for the selected location. Select location within the grayed area. (2)");
		return;
	}
	mapping.clickLocationInteraction.getFeatures().push(cmz_features[0]);

	var county_features = mapping.countyLayer.getSource().getFeaturesAtCoordinate(coordinates);
	if (county_features.length == 0)
	{
		alert("There is no data for the selected location. Select location within the grayed area. (3)");
		return;
	}
	mapping.clickLocationInteraction.getFeatures().push(county_features[0]);

	// In case of multiple features selected on each layer (border?), just use the first.
	var features = [cmz_features[0], county_features[0]];

	geo_event.selected = features; 
	
	mapping.view.setCenter(coordinates);
	
	if (mapping.smallScreen)
		mapping.view.setZoom(11);
	else	// !gl_smallScreenSizeFlag
		mapping.view.setZoom(9);
	
	mapping.selectLocation(geo_event);
}

// Create a permalink for the current map center and zoom.
// Pushes location information to hash in url, User can paste in URL with hash to zoom to set location.
mapping.createPermalink = function()
{
	var zoom = mapping.view.getZoom();
	// Center is stored in EPSG:4326 since this is user readable
	center = ol.proj.transform(mapping.view.getCenter(), 'EPSG:3857', 'EPSG:4326');
	
	// Round the lat long cordinates.
	var hash = '#map=' + zoom + '/' + Math.round(center[0] * 100000) / 100000 + '/' + Math.round(center[1] * 100000) / 100000;
	var state = {
		zoom: zoom,
		center: center
	}
	window.history.pushState(state, 'map', hash);
}

mapping.selectLocation = function(evt){      
	
	var features = evt.selected;  

	// Make sure multiple features were selected (County Layer and CRD Layer)
	if (features.length > 0 && typeof(features[0]) != 'undefined' && typeof(features[1]) != 'undefined')
	{
		// Selection was made of the feature layer. Process the selection.
		var coordinates = evt.mapBrowserEvent.coordinate;
		mapping.selectedLocationPoint = coordinates
		var lonlat = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
		var lat = ol.coordinate.format(lonlat,'{x}', 3);
		var lon = ol.coordinate.format(lonlat,'{y}', 3);
		
		var countyName = null, stateName = null; maturityZone = null; plant_date = null;
		var feature_set = null;
		var eventFeatureCount = 0;

		while (eventFeatureCount < features.length)
		{
			feature_set = features[eventFeatureCount].getProperties();
			if (feature_set)
			{
				if (stateName == null && feature_set['STATE_ABBR'])
					stateName = feature_set['STATE_ABBR'];

				if (countyName == null && feature_set['CNTY_NAME'])
					countyName = feature_set['CNTY_NAME'];

				if (maturityZone == null && feature_set['Mat_Zone'])
					maturityZone = feature_set['Mat_Zone'];

				if (plant_date == null && feature_set['PLANT_DATE'])
					plant_date = parseInt(feature_set['PLANT_DATE'], 10);
							
			}
						
			eventFeatureCount++;
		}

		// Update the global planting date
		if (plant_date != null)
		{
			plantDate = plant_date;
		}
			// Force planting date to be 5/10 for sorghum gdd's for now
		plantDate = 510;
					
		if (stateName != null && countyName != null)
		{                                
			var html_text = '';
			if (mapping.smallScreen)
			{
				html_text += '<span style="font-size:28px">'+ countyName + ' Co., ' + stateName + '<br>Lat-Lon: ' + lat + ', ' + lon + '</span><br>'+ '<button type="button" style="width:300px; height:60px" onclick=\'generate_gdd_graph("' + lonlat[0] + '", "' + lonlat[1] + '", "' + countyName + '", "' + stateName + '", "' + maturityZone + '");\' ><span style="font-size:28px">Create GDD Graph</span></button>';
			}
			else
			{
				html_text += countyName + ' Co., ' + stateName + '<br>Lat-Lon: ' + lat + ', ' + lon + '<br>'+ '<button type="button" onclick=\'generate_gdd_graph("' + lonlat[0] + '", "' + lonlat[1] + '", "' + countyName + '", "' + stateName + '", "' + maturityZone + '");\' >Create GDD Graph</button>';
			}

			// Close Existing Pop-up
			mapping.deselectLocation();
			
			mapping.popContent.innerHTML = html_text
		
			if (mapping.view.getZoom() > 5)
			{
				mapping.panToCoordinates(coordinates);
			}
			else
			{
				var pixels = mapping.map.getPixelFromCoordinate(coordinates);
				if (pixels[1] < 200)
				{
					mapping.popOverlay.setPositioning('bottom-left');
				}
			}

			mapping.pointSelected = true;
			mapping.popOverlay.setPosition(coordinates);
		}
		else
		{
			mapping.deselectLocation();
			alert("There is no data for the selected location. Select location within the grayed area. (4)");
		}
		
	}	
	else
	{
		// Selection was not made over the feature layer. Present message to the user indicating such.
		mapping.deselectLocation();
		alert("There is no data for the selected location. Select location within the grayed area. (5)");
	}
					
}		// end "selectLocation"

// Handle when the map would be resized, also used when returning to map tab in case any cleanup is needed.
mapping.handleResizeWindow = function()
{
	mapping.map.updateSize();  

	// Re-cented selected location
	if (mapping.pointSelected)
	{
		var coordinates = mapping.popOverlay.getPosition();
		if (coordinates != null && mapping.view.getZoom() > 5)
		{
			mapping.view.setCenter(coordinates);
		}
	}
			
} 


// Gets location from geo point
mapping.getLocationByGeoPoint = function(lon, lat)
{
	// Convert lat/lon to locale projection
	var coordinates = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');

	mapping.geoLocationPop(coordinates);
}

// Gest the location by county, using geo server and getting gemotry polygon
mapping.getLocationByCounty = function(state, county)
{
	var county_alias = [];
	county_alias.push(county);
	county_alias.push(county + " County");

	var layer_source = mapping.countyLayer.getSource();
	var all_county_features = layer_source.getFeatures();

	$.each(all_county_features, function(index, feature){
		if (county_alias.indexOf(feature.get('CNTY_NAME')) > -1 && feature.get('STATE_NAME') == state)
		{
			mapping.view.fit(feature.getGeometry().getExtent(), mapping.map.getSize());
			//$('circle').css('opacity' , '1');
			return true;
		}
	});
}

/*
 * Mapping Search 
 *
 */

// Define the data and methods for search box on the map.
var mappingSearch = new Object();

mappingSearch.searchTerm = "";
mappingSearch.searchResults = null;
mappingSearch.re = null;
mappingSearch.foundCounties = [];
mappingSearch.searchTimeout = null;

// Clear the search results.
mappingSearch.clearResults = function()
{
	this.searchResults = new Object({
		states : [],
		counties : [],
	});
	
	this.foundCounties = [];
}

// Allows us to search for locations with some critera
mappingSearch.search = function()
{
	mapping.closePop();

	// Search Terms will be broken apart
	// TODO BREAK APART SO WE CAN SEARCH FOR MORE THAN ONE THING AT A TIME
	this.searchTerm = $('#search_ol input').val().trim();
	this.re = new RegExp(this.searchTerm, 'gi');
	
	// Make sure it has length other wise return
	if (this.searchTerm.length > 0)
	{
		// Create an results array to output
		mappingSearch.clearResults();
		
		var states_array = new Array();
		var counties_array = new Array();
		var countyLayer_features = mapping.countyLayer.getSource();

		countyLayer_features.forEachFeature(mappingSearch.eachCountySearch, this);
		
		var obj_count = 0;

		// Max results to show and to grab
		var max_results = 15;

		// We want to show a list of results
		$.each(mappingSearch.searchResults, function(type, datum)
		{
			$.each(datum, function(index, feature)
			{
				if(obj_count < max_results)
				{
					mappingSearch.appendToDisplayList(type, feature.data);
					obj_count++;
				}
			});
			$('#search_results_ol div:first').addClass('active');
		});

		if ($('#search_results_ol > div').length == 0)
		{
			// If all characters are numbers and number of them are less than 5, do not do any searching. User may be entering a zip code.
			var reg = new RegExp("^[0-9]");
			numberOnlyFlag = reg.test(this.searchTerm);
			if ((numberOnlyFlag && this.searchTerm.length >= 5) || !numberOnlyFlag && this.searchTerm.length >= 2)
			{
				// Look for address / zip code
				this.find_location_by_address_zip(this.searchTerm);
			}
				
		}
	}
	else
	{
		clearTimeout(mapping.searchTimeout);
	}
}

// Gets the location by address or zip code from google api
mappingSearch.find_location_by_address_zip = function(address_or_zip)
{
	// Clears previous timemout
	clearTimeout(this.searchTimeout);

	// Sets a timeout so we dont over query the server, .5 sec
	this.searchTimeout = setTimeout(function()
	{
		$('#search_results_ol').children().remove();
		mappingSearch.requestGeocodeFromGoogle(address_or_zip);
		
	}, 500);
}

// Using googe here to geocode provided address into coordinates.
mappingSearch.requestGeocodeFromGoogle = function(address_or_zip)
{
	// Do an ajax call
	var geocode_search = $.ajax({
		url: 'purdue_gdd/gdd/proxy',
		data:
		{
			url: 'http://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address_or_zip) + '&sensor=false',
			json: true
		},
	});

	geocode_search.done(this.googleGeocodeSuccess);
}

// Coordinates retrieved from Google, add options to search list if in our results area.
mappingSearch.googleGeocodeSuccess = function(data)
{
	// Reset results object
	var results = data.results;
	if (results.length > 0)
	{
		$.each(results, function(index, result)
		{
			var result_state = null;
			// get the state
			$.each(result.address_components, function(index, data)
			{
				// Must be this type of area
				if (data.types[0] == "administrative_area_level_1")
				{
					var state = null;
					// Set the state name
					result_state = ucwords(data.long_name);

					// Make sure its really the long name
					$.each(mapping.states, function(index, value)
					{
						if (value.abbrev.toLowerCase() == result_state.toLowerCase())
						{
							state = value.name;
						}
					});

					if (state)
					{
						result_state = state;
					}
				}
			});

			// Make sure they are within our valid states
			if ($.inArray(result_state, mapping.validStates) != -1)
			{
				// Append to the list of results
				$('#search_results_ol').append('<div data-type="lon_lat" data-lat="' + result.geometry.location.lat + '" data-lon="'+ result.geometry.location.lng + '" class="result_click">' + result.formatted_address + '</div>');
			}
		});
	}

	// So, no results
	if ($('#search_results_ol > div').length == 0)
	{
		$('#search_results_ol').append('<div>Sorry, there are no results.</div>');
	}
	else
	{
		$('#search_results_ol div:first').addClass('active');
	}
}

// Operate on each available county, adding counties to search results.
mappingSearch.eachCountySearch = function(feature) 
{
	// Get county info
	var temp_county = ucwords(feature.get('CNTY_NAME'));
	var temp_state_abb = feature.get('STATE_ABBR');
	var temp_state = null;

	if (temp_county.match(mappingSearch.re))
	{
		mappingSearch.resultsAddCounty({data: feature});
	}
}

// Add found county to search results list, make sure it is not duplicated.
mappingSearch.resultsAddCounty = function(obj)
{
	var temp_county = ucwords(obj.data.get('CNTY_NAME'));
	var temp_state_abb = obj.data.get('STATE_ABBR');

	if ($.inArray(temp_county + '.' + temp_state_abb, this.foundCounties) == -1)
	{
		this.foundCounties.push(temp_county + '.' + temp_state_abb);
		this.searchResults.counties.push(obj);
	}
}

// Render to search results, placing them below search box.
mappingSearch.appendToDisplayList = function(type, feature)
{

	// Get the information from the county layer
	var temp_county = ucwords(feature.get('CNTY_NAME'));
	var temp_state = feature.get('STATE_ABBR');

	switch (type)
	{
		case 'states' :
			$.each(mapping.states, function(index, value)
			{
				if (value.abbrev.toLowerCase() == feature.data.State.toLowerCase())
				{
					state = value.name;
				}
			});
			var new_text = state;
			// Append to the list of results
			$('#search_results_ol').append('<div data-type="' + type + '" data-state="' + temp_state + '" class="result_click">' + new_text + '</div>');
		break;

		case 'counties':
			var new_text = temp_county + ' County, ' + temp_state;
			// Append to the list of results
			$('#search_results_ol').append('<div data-type="' + type + '" data-state="' + temp_state + '" data-county="' + temp_county + '" class="result_click">' + new_text + '</div>');
		break;
		
	}
}

// Handle all interactions with the map search box including firing events based on type of search.
mappingSearch.addSearchBindings = function()
{
	// Interacting / Typing in search box
	$('#search_ol input').focus(function()
	{
		$('.cancel_request').hide();
		$('#search_ol input').parents('div:eq(0)').addClass('active');
	});

 	// No longer interacting with search box
	$('#search_ol input').blur(function()
	{
		$('#search_ol input').parents('div:eq(0)').removeClass('active');
	});

	// Keyboard interaction - when key is pressed
	$('#search_ol input').keydown(function(e){
		mappingSearch.handleSearchKeydown(e);
	});

	// Keyboard insteraction - when key is released
	$('#search_ol input').keyup(function(e){
		mappingSearch.handleSearchKeyup(e);
	});

	// Search result is clicked - determine type and handle location.
	$(document).on('click', '.result_click', mappingSearch.handleResultsClick);

	// Search button (magnifying glass) is clicked - toggle box
	$('#search_ol_button').click(mappingSearch.handleSearchToggle);

	// "X" in search box is clicked - close
	$('.clear_search').click(function()
	{
		$('#search_ol input').val('').blur();
		mappingSearch.hideSearchBox();
		// Remove Results list
		$('#search_results_ol').children().remove();
	});

	// Add Ctrl+s to open or focus on search
	$(document).keypress(function(e){
		mappingSearch.handleSearchKeypress(e);
	});
}

// Handle "ESC" key from within search.
mappingSearch.handleSearchEscape = function()
{
	// Hide the search box
	mappingSearch.hideSearchBox();
}

// Handle Keyboard "up arrow" from within search, allows user to navigate the reults list via keyboard.
mappingSearch.handleSearchUpArrow = function()
{
	// No need if we dont have more than 1 result
	if ($('#search_results_ol').children().length > 1)
	{
		// Grabs the new active result
		var new_active = $('#search_results_ol div.active').prev();

		// Checks to see if we should go back to the input
		if (new_active.length > 0)
		{
			// Show as active
			$('#search_results_ol div.active').removeClass('active');
			new_active.addClass('active');

			// Show new text as the selected option using the arrows
			$('#search_ol input').val(new_active.text());
		}
		else
		{
			// If already focused on input move to bottom of list
			if($('#search_ol input').focus().val() == mappingSearch.searchTerm)
			{
				// We need to add an active class
				new_active = $('#search_results_ol div').last().addClass('active');
				$('#search_ol input').val(new_active.text());
			}
			else
			{
				// Focus the input and put original search back in
				$('#search_results_ol div.active').removeClass('active');
				$('#search_ol input').focus().val(mappingSearch.searchTerm);
			}
		}
	}
}

// Handle Keyboard "down arrow" from within search, allows user to navigate the reults list via keyboard.
mappingSearch.handleSearchDownArrow = function()
{
	// No need if we dont have more than 1 result
	if ($('#search_results_ol').children().length > 1)
	{
		// Check to see if we have any active
		var new_active = $('#search_results_ol div.active');

		if (new_active.length > 0)
		{
			// We have an active so select the next div
			$('#search_results_ol div.active').removeClass('active');
			new_active = new_active.next();

			// If there isn't a div that means we are at the bottom
			if (new_active.length > 0)
			{
				// Show as active
				new_active.addClass('active');

				// Show new text as the selected option using the arrows
				$('#search_ol input').val(new_active.text());
			}
			else
			{
				// Focus the input and put original search back in
				$('#search_ol input').focus().val(mappingSearch.searchTerm);
			}
		}
		else
		{
			// We need to add an active class
			new_active = $('#search_results_ol div').first().addClass('active');
			$('#search_ol input').val(new_active.text());
		}
	}
}

// Handle Keyboard "Enter", which will select the active item in the search results list.
mappingSearch.handleSearchEnterKey = function()
{
	if ($('#search_results_ol div.result_click').length > 0)
	{
		if ($('#search_results_ol div.active').hasClass('active'))
		{
			$('#search_results_ol div.active').click();
		}
	}
}

// Handle keyboard entries while focused on the search box.
// Filters for a certain set of keys which have special actions.
mappingSearch.handleSearchKeydown = function(e)
{
	var reg = new RegExp("^[a-zA-Z0-9]+$");
	var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);

	// Only allow alphanumeric letters to search
	if (reg.test(str) || e.which == 38 || e.which == 40 || e.which == 13 || e.which == 27 || e.which == 8)
	{
		// "ESC" key, Closes the search
		if (e.which == 27)
		{
			mappingSearch.handleSearchEscape();
		}
		// Keyboard "Up Arrow" - Move up in the list
		else if (e.which == 38)
		{
			// Stops it from moving cursor
			e.preventDefault();
			mappingSearch.handleSearchUpArrow();
		}
		// Keyboard "Down Arrow" - Move down in the list
		else if (e.which == 40)
		{
			// Stops it from moving cursor
			e.preventDefault();
			mappingSearch.handleSearchDownArrow();

		}
		// "Enter" Key - Lets click the active div
		else if (e.which == 13)
		{
			mappingSearch.handleSearchEnterKey();
		}
	}
}

// Handles keyboard entries while focused on the search box.
mappingSearch.handleSearchKeyup = function(e)
{
	var reg = new RegExp("^[a-zA-Z0-9]+$");
	var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);

	// Only allow alphanumeric letters to search, backspace also performs search.
	if (reg.test(str) || e.which == 8)
	{
		$('#search_results_ol').children().remove();
		// Gather search results based on terms entered in search box.
		mappingSearch.search();
	}
}

// Handle other keypresses including ctrl+s to open or focus on search
mappingSearch.handleSearchKeypress = function(e)
{
	if (e.target.nodeName != 'input' && e.target.nodeName != 'textarea')
	{
		// Ctrl (or cmd) +s
		if (e.which == 115 && (e.ctrlKey || e.metaKey))
		{
			e.preventDefault();
			// Focus on already visible search box
			if ($('#search_ol').hasClass('shown'))
			{
				$('#search_ol input').focus();
			}
			// Open search box
			else
			{
				$('#search_ol_button').click();
			}
		}
	}
}

// Handles a click of a single search results.
// Determines type of feature contained in results, and calls appropriate function to focus on.
mappingSearch.handleResultsClick = function()
{
	if ($(this).data('type') == 'lon_lat')
	{
		// Get extent of states
		mapping.getLocationByGeoPoint($(this).data('lon'), $(this).data('lat'));
	}
	else if ($(this).data('type') == 'counties')
	{
		result = $(this);
		$.each(mapping.states, function(index, value){
			if (value.abbrev.toLowerCase() == result.data('state').toString().toLowerCase())
			{
				state = value.name;
			}
		});

		// Get extend of counties
		mapping.getLocationByCounty(state, $(this).data('county'));
	}
	
	$('.clear_search').click();
}

// Show the search box.
mappingSearch.showSearchBox = function()
{
	$('#search_ol').addClass('shown').animate({marginLeft: "0"}, 500);
	$('#search_ol input').focus();
}

// Hide the search box.
mappingSearch.hideSearchBox = function()
{
	$('#search_ol').removeClass('shown').animate({marginLeft: "-245px"}, 500).val('').blur();
	$('#search_results_ol').children().remove();
}

// Toggle the search box.
// Looks at state of the search box via "shown" class.
mappingSearch.handleSearchToggle = function()
{
	if ($('#search_ol input').val().length > 0)
	{
		if ($('#search_ol').hasClass('shown'))
		{
			mappingSearch.hideSearchBox();
		}
		else
		{
			mappingSearch.showSearchBox();
		}
	}
	else
	{
		if ($('#search_ol').hasClass('shown'))
		{
			mappingSearch.hideSearchBox();
			$('#search_ol input').val('').blur();
		}
		else
		{
			mappingSearch.showSearchBox();
		}
	}
} 

// References
//http://stackoverflow.com/questions/27200086/restrict-pan-outside-wms-extent-in-openlayers3

//http://openlayers.org/en/v3.12.1/apidoc/ol.View.html#constrainCenter
//https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!msg/ol3-dev/LoBb9VACPfI/E8zFAldqZnAJ

// http://gis.stackexchange.com/questions/61479/how-to-get-a-feature-that-lies-closest-to-a-point-in-openlayers
