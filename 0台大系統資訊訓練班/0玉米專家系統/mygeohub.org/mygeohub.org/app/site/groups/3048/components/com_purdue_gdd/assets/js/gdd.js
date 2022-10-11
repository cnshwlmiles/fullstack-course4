// Revised 01/06/2016 by Larry Biehl. Correction for determining visibility of last freeze when year has changed over but gdd default data for previous year.
// Revised 03/10/2016 by Chris Panza. Updated mapping to use openlayers 3.
// Revised 06/22/2016 by Larry Biehl. Change for 2015 data now being in the historical file. Also corrected error where average first and last freeze on graph was 1 day later than it should have.
// Revised 01/03/2017 by Larry Biehl. Change to handle leap year when the last day of the year represents 366 days. Only the first 365 days are used.
// Revised 02/15/2017 by Larry Biehl. Update code to reflect gdd accumulation for 2017 instead of 2016. Changes include:
//     Change gCurrentYear from 2016 to 2017
//     Also followed the notes below for "Historical Data File Change" and "Start New Year".
// Revised 02/16/2017 by Larry Biehl. Added gDefaultForecast_data_display variable so that the default days of forecast (30 currently) is only
//    set in one place.
// Revised 02/17/2017 by Larry Biehl. Missed change in gHistoricalDataIncludesPreviousYearFlag flag yesterday.
//    Correction made so that 'Current Day' option would be reset when page was forced to be redrawn.
// Revised 06/14/2017 by Larry Biehl. Changed name from gdd to purdue_gdd
// Revised 07/12/2017 by Larry Biehl
// Revised 07/25/2017 by Larry Biehl. Correct usage for mapping.mobileUser for tooltips
// Revised 09/21/2017 by Larry Biehl. Turned similar gdd year feature on
// Revised 06/03/2019 by Larry Biehl. Turned gHistoricalDataIncludesPreviousYearFlag on
// Revised 01/28/2020 by Larry Biehl. for change from 2019 to 2020
// Revised 02/20/2021 by Larry Biehl. for change from 2020 to 2021
// Revised 02/21/2022 by Larry Biehl. for change from 2021 to 2022
// Revised 03/07/2022 by Larry Biehl. Forcing a change in the file, so that it will be pushed again to production.
// Revised 08/05-15/2022 by Larry Biehl. for change to read 1981 to 2021 data from single file.
// Revised 09/14/2022 by Larry Biehl. Set 'gDefaultForecast_data_display' to 0 since forecast data for NOAA is not being update.
/***********************
*  com_purdue_gdd/assets/js/gdd.js
*
*  This javascript file contains all of the brains behind setting up the map (pulling correct overlays, choosing points, etc.),
*  setting up the graph of accumulated GDD data, and setting up the information displayed in the data tab (available for download).
*
*	Note: Check locations with the "Historical Data File Change" when the previous year data has been added to the historical file.
*			Check locations with "Start New Year" when a new year is started.
*			Those locations are almost directly below and one in the "getData" routine.
*  Note: Also be sure to change the file names in the play.php file in the controller directory.
*        And also the years for the drop down menus in display.php for 'drop_projection_start' and 'drop_projection_startData'.
************************/

document.title = 'Corn Growing Degree Day Tool: Useful to Usable (U2U)';

/*** Variables keyed to starting a New Year or adding a year to the historical data files. ***/
// "Start New Year" 
// gCurrentYear is the default planting year to be charted. In early parts of the year (before February) this will still be the previous planting year
var gCurrentYear = 2022;

// "Historical Data File Change"
// gFreezeDataYears reflects the number of years in the full freeze day-of-year file.
var gFreezeDataYears = 41;

// "Start New Year" and "Historical Data File Change"
// Flag indicating whether the previous year data is included in the historical data files.
var gHistoricalDataIncludesPreviousYearFlag = true;

// Start and End index for range for 30-year averages. Note that index are 0 based and last_freeze
// index is for use with '<' comparison_end_index
// index of 0 represents the year 1981 in the input data.
var gHistoryIndexStart = 10;
var gHistoryIndexEnd = gHistoryIndexStart + 30;

/*** Variables for use with the map portion ***/
var plotGdd = false;
var gl_using_select2 = false;

// Selected Location and Defaults
var latitude = 40.40855985435839;
var longitude = -86.8815878906248;
var state = "IN";
var county = "Tippecanoe";
var plantDate = 401;

/*** Ajax objects **/
var allGDDAjax;
var minDataAjax;
var currentYearDataAjax;
var previousYearDataAjax;
var currentMinDataAjax;
var previousMinDataAjax;
var forecastDataAjax;

/*** Chart and Data variables ***/
// Default values for the dropdown menus
var maturity_choice_index = 23;
var freeze_choice_index = 3;
var freeze_choice_value = 28;

var gPrevYear = gCurrentYear - 1;
var systemYear = new Date().getFullYear();

var gNumberOfYears = gCurrentYear - 1981;
var default_comparison_choice_index = gNumberOfYears - 1;
var selected_comparisons = [];
var percentile_choice_index = 0;
var month_choice_index = 3;
var day_choice_index = 0;
var current_day_index = 0;
var gNumberOfModels = 20;

var gNewDataLoadedFlag = false;

// Get minimum temperature data for both this year and last
//var minimum_current_data = getMinimumCurrentData().split(" ");
//var minimum_previous_data = getMinimumPreviousData().split(" ");
//var orig_all_min_data = getmindata().split(" ");
//var all_min_data = orig_all_min_data.slice();
var minimum_current_data = [];
var minimum_previous_data = [];
var orig_all_min_data = [];
var all_min_data = [];

var gDefaultForecast_data_display = 30;		// Controls how many days of the 90 day forecast will be used. 30 is the default
var forecast_data_display = gDefaultForecast_data_display;		// Variable contains how many forecast days actually being used.
var all_forecast_data = [];
var forecast_mean = [];

// Get all accumulated gdd data for 1981-2015
//var allGDD = getallgdddata().split(" ");
var allGDD = [];
// Get accumulated gdd for the current year
var orig_current_year_data = [];
// All gdd data for previous year
var orig_previous_year_data = [];
// First 365 values of allGDD are the average values over 1981-2010
//var orig_average_data = allGDD.slice(0,365);
var orig_average_81to10_data = [];
// Second 365 values of allGDD are the median values over 1981-2010
//var orig_median_data = allGDD.slice(365, 730); // Currently not used in the GDD tool
//var orig_median_data = [];

// 1991-2020 30 year gdd averages are calculated.
var orig_average_91to20_data = [];
var average_91to20_data = [];

// Make copies of the original data that we can manipulate and not lose the original data
// Would need to re-read the data and that takes too much time
//var current_year_data = orig_current_year_data.slice();
//var average_data = orig_average_data.slice();
var current_year_data = [];
var average_81to10_data = [];

// Extract individual years from allGDD array (after average and median data)
//var orig_all_years_data = allGDD.slice(730, allGDD.length+1);
var orig_all_years_data = [];
var yearsArray = new Array(gNumberOfYears);

// Make a copy of all individual years data for reasons listed above
var all_previous_years = new Array(gNumberOfYears);

// Previous year data is going to be the comparison year.  Use that value to select a year.
var previous_year_data = new Array(3);

// Set up variable to display hold projection values for dates we haven't reached yet
var current_year_projection = [];
// Set up variable to display projected forecast data (current year)
var current_year_forecast_projection = [];
// Set up variable to display historical projection for current year
var current_year_hist_projection = [];


var orig_forecast_models = new Array(gNumberOfModels);
var forecast_models = new Array(gNumberOfModels)

var day_for_date = 1;
var day_for_maturity = 95;
var gMaxGDDValue = 0;

// Silk and blacklayer day number where reached variables
var gdd_silk = 0;
var gdd_blacklayer = 0;
// Silk and blacklayer arrays for vertical line on graph
var silk = new Array(365);
var blacklayer = new Array(365);
// Initialize arrays with 0's 
for(var i = 0; i < 365; i++){
	silk[i] = 0;
	blacklayer[i] = 0;
}
// Arrays for horizontal silk and black layer lines on the graph
var silking_horizontal = new Array(365);
var blacklayer_horizontal = new Array(365);
// Arrays for high and low silk and black layer vertical lines
var silking_low_range = new Array();
var silking_high_range = new Array();
var blacklayer_low_range = new Array();
var blacklayer_high_range = new Array();

// Arrays for freeze data, for dates, count and year strings
var last_freeze = new Array(365);
var first_freeze = new Array(365);
var all_last_freezes = new Array(365);
var all_last_freezes_data = new Array(365);
var all_first_freezes = new Array(365);
var all_first_freezes_data = new Array(365);
var last_freeze_count = new Array(365);
var first_freeze_count = new Array(365);
var last_freeze_strings = new Array(365);
var first_freeze_strings = new Array(365);
var average30YearLastFreeze = 0;
var average30YearFirstFreeze = 0;
var average1981_2010YearLastFreeze = 0;
var average1981_2010YearFirstFreeze = 0;
// Initialize freeze arrays to 0 and empty strings
/*for(var i = 0; i < 365; i++){
	last_freeze[i] = 0;
	first_freeze[i] = 0;
	all_last_freezes[i] = 0;
	all_first_freezes[i] = 0;
	last_freeze_count[i] = 0;
	first_freeze_count[i] = 0;
	last_freeze_strings[i] = "";
	first_freeze_strings[i] = "";
}
*/
var gGDD_vn = new Array(8);
var gVnDayOfYear = new Array(8);
var gVnEarliestDayOfYear = new Array(8);
var gVnLatestDayOfYear = new Array(8);
var gGDD_vn_label = new Array(8);
var gEmergenceIndex = 0;
var gV2Index = 1;
var gV4Index = 2;
var gV6Index = 3;
var gV8Index = 4;
var gV10Index = 5;
var gSilkingIndex = 6;
var gBlacklayerIndex = 7;
// Variable to determine last freeze day number
var last_freeze_point;

// Boolean for remembering legend selection
var show_silking = true;
var show_silking_horizontal = true;
var show_blacklayer = true;
var show_blacklayer_horizontal = true;
var show_average_last_freeze = true;
var show_all_last_freezes = true;
var show_average_first_freeze = true;
var show_all_first_freezes = true;
var show_average = true;
var show_median = false;
var show_comparison_year = true;
var show_current_projection = true;
var show_current_year = true;
var show_full_range = true;
var show_projected_range = true;

var no_variation = false;

// Arrays for projection line and ranges
// 	plot_range is for range of 30 year history; 0 index is first day of the year.
// 	all values before the start_date (or planting date) will be set to 0
var plot_range = new Array(365);
// plot_range_projection is for range of 30 year history since the current day; index 0 represents the current day
var plot_range_projection = new Array(365);
var orig_low_range = new Array(365);
var orig_high_range = new Array(365);
var orig_low_range_projection = new Array(365);
var orig_high_range_projection = new Array(365);
var low_range = new Array(365);
var high_range = new Array(365);
var full_plot_range = new Array(365);
var forecast_high = new Array();
var forecast_low = new Array();

// Current day of year and plant date
var current_day = 0;
var start_date = 0;

// Misc Vars
var cancel_request = null; // used to cancel requests outside of the functions
var search_timeout = null;
var search_term = null;
var gHighchart = null;
var gSingleIntroJSCallFlag = false;

/*** End Chart and Data variables ***/

    	// Cancels any XHR requests (AJAX Requests)
function cancelRequest()
	{
	//console.log("enter cancel_request");
	allGDDAjax.abort();
	minDataAjax.abort();
	currentYearDataAjax.abort();
	if (previousYearDataAjax != null)
		previousYearDataAjax.abort();
	currentMinDataAjax.abort();
	previousMinDataAjax.abort();
	forecastDataAjax.abort();
	dataLoadFailure();
	};

// set up a highcharts chart variable so we can interact with the chart after the initialization
function chart() {
	// Before we make the chart, determine if we should show the last spring freeze lines by default or not
	determine_last_freeze_visibility();
        // Determine an estimate for the yAxis maxes
        
    var axisMaxes = getYAxisMaxes();
    
    if (gHighchart)
    	gHighchart.destroy();

    // Set code for routine to indicate whether this is a chart for the current year or the previous year
	var currentYearCode = 1;
	var graphYear = gCurrentYear;
	if(document.getElementById('drop_projection_start').options[document.getElementById('drop_projection_start').selectedIndex].text.indexOf(gPrevYear) != -1){
		currentYearCode = 2;
		graphYear = gPrevYear; }

    // Initialize title text for the x-axis
	var xAxisTitle = 'Date ('+gCurrentYear+')';
	if (currentYearCode == 2) {
		xAxisTitle = 'Date ('+gPrevYear+')'; }
    
	var chart_series = [{
			name: 'GDD Percentile Range',
			data: plot_range,
			type: 'arearange',
			fillOpacity: 0.2,
			zIndex: 0,
			lineWidth: 0,
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			legendIndex: 10,
			showInLegend: false,
			visible: show_full_range
		},{
			name: 'GDD Percentile Projected Range',
			data: plot_range_projection,
			type: 'arearange',
			fillOpacity: 0.3,
			zIndex: 0,
			lineWidth: 0,
			pointStart: Date.UTC(graphYear, 0, 1),
			legendIndex: 10,
			showInLegend: false,
			visible: show_projected_range
		},{
			name: 'Silking',
			type: 'column',
			data: silk,
			//color: '#FF0000',
			color: '#FF3333',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			visible: show_silking,
			selected: show_silking,
			legendIndex: 7,
		},{
			name: 'Silking Horizontal',
			data: silking_horizontal,
			//color: '#FF0000',
			color: '#FF3333',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			showInLegend: false,
			lineWidth: 1,
			visible: show_silking_horizontal
		},{
			name: 'Silking Earliest',
			data: silking_low_range,
			//color: '#FF0000',
			color: '#FF3333',
			pointStart: Date.UTC(graphYear, 0, 1),
			zIndex: 1,
			showInLegend: false,
			lineWidth: 1,
			visible: show_silking_horizontal,
			dashStyle: 'dash'
		},{
			name: 'Silking Latest',
			data: silking_high_range,
			//color: '#FF0000',
			color: '#FF3333',
			pointStart: Date.UTC(graphYear, 0, 1),
			zIndex: 1,
			showInLegend: false,
			lineWidth: 1,
			visible: show_silking_horizontal,
			dashStyle: 'dash'
		},{
			name: 'Black Layer',
			type: 'column',
			data: blacklayer,
			color: '#000000',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			visible: show_blacklayer,
			selected: show_blacklayer,
			legendIndex: 8
		},{
			name: 'Black Layer Horizontal',
			data: blacklayer_horizontal,
			color: '#000000',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			showInLegend: false,
			lineWidth: 1,
			visible: show_blacklayer_horizontal
		},{
			name: 'Black Layer Earliest',
			data: blacklayer_low_range,
			color: '#000000',
			showInLegend: false,
			lineWidth: 1,
			pointStart: Date.UTC(graphYear, 0, 1),
			zIndex: 1,
			visible: show_blacklayer_horizontal,
			dashStyle: 'dash'
		},{
			name: 'Black Layer Latest',
			data: blacklayer_high_range,
			color: '#000000',
			showInLegend: false,
			lineWidth: 1,
			pointStart: Date.UTC(graphYear, 0, 1),
			zIndex: 1,
			visible: show_blacklayer_horizontal,
			dashStyle: 'dash'
		},{
			name: 'Last Freeze (Spring)',
			type: 'column',
			data: last_freeze,
			//color: '#5AD7FA',
			color: '#00CCFF',
			pointWidth: 5,
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			visible: show_average_last_freeze,
			selected: show_average_last_freeze,
			legendIndex: 5,
            yAxis: 1
		},{
			name: 'First Freeze (Fall)',
			type: 'column',
			data: first_freeze,
			//color: '#5AD7FA',
			color: '#00CCFF',
			pointWidth: 5,
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			visible: show_average_first_freeze,
			selected: show_average_first_freeze,
			legendIndex: 6,
            yAxis: 1
		},{
			name: 'Last Freeze Range',
			type: 'column',
			data: all_last_freezes,
			//color: '#5AD7FA',
			color: '#00CCFF',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			showInLegend: false,
			zIndex: 1,
			visible: show_all_last_freezes,
			yAxis: 1
		},{
			name: 'First Freeze Range',
			type: 'column',
			data: all_first_freezes,
			//color: '#5AD7FA',
			color: '#00CCFF',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			showInLegend: false,
			visible: show_all_first_freezes,
			yAxis: 1
		},{
			name: 'Avg. GDD (1991-2020)',
			data: average_91to20_data,
			//color: '#3C00E0',
			color: '#9900CC',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			id: 'average',
			zIndex: 1,
			visible: show_average,
			selected: show_average,
			legendIndex: 3
		},
		/*
		{
			name: 'Median GDD (1981-2010)',
			data: median_data,
			//color: '#ED7411',
			color: '#FF9933',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			visible: show_median,
			legendIndex: 4
		},
		*/
		{
			name: gCurrentYear + ' GDD',
			data: current_year_data,
			//color: '#3d8709',
			color: '#336600',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			zIndex: 1,
			visible: show_current_year,
			selected: show_current_year,
			legendIndex: 0
		},{
			name: gCurrentYear + ' GDD Projection',
			data: current_year_projection,
			pointInterval: 24 * 3600 * 1000,
			dashStyle: 'dash',
			color: '#000000',
			zIndex: 1,
			visible: show_current_projection,
			selected: show_current_projection,
			legendIndex: 2
		}];

	if ( selected_comparisons.length > 0 ){
		chart_series.push({
			name: 'GDD Comparison (' + $("#drop_comparison option[value='"+selected_comparisons[0]+"']").text() + ')',
			data: previous_year_data[0],
			//color: '#A00000',
			color: '#FFA500',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			visible: show_comparison_year,
			selected: show_comparison_year,
			legendIndex: 2
		});
	}

	if ( selected_comparisons.length > 1 ){
		chart_series.push({
			name: 'GDD Comparison (' + $("#drop_comparison option[value='"+selected_comparisons[1]+"']").text() + ')',
			data: previous_year_data[1],
			color: '#DCB826',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			visible: show_comparison_year,
			selected: show_comparison_year,
			legendIndex: 2
		});
	}

	if ( selected_comparisons.length > 2 ){
		chart_series.push({
			name: 'GDD Comparison (' + $("#drop_comparison option[value='"+selected_comparisons[2]+"']").text() + ')',
			data: previous_year_data[2],
			color: '#8b4513',
			pointStart: Date.UTC(graphYear, 0, 1),
			pointInterval: 24 * 3600 * 1000,
			visible: show_comparison_year,
			selected: show_comparison_year,
			legendIndex: 2
		});
	}
var chart_legend = {
	layout: 'vertical',
	align: 'left',
	verticalAlign: 'top',
	x: 75,
	y: 60,
	floating: true,
	backgroundColor: '#FFFFFF',
	borderWidth: 1,	// now 0
	borderRadius: 5,	// now 0
	itemStyle: {
		color: '#274b6d', // now #333333
		fontWeight: 'normal' // now bold
		},
	symbolRadius: 2	// now 0
};

if (mapping.mobileUser){
	chart_legend.itemMarginTop = 4;
	chart_legend.itemMarginBottom = 4;
}

Highcharts.setOptions({
		lang: {
			thousandsSep: ','
			}
		});

gHighchart = new Highcharts.Chart({
		chart: {
			type: 'line',
			marginRight: 60,
			marginBottom: 70,
			renderTo: 'graph_element',
			zoomType: 'xy',
         panning: true,
         panKey: 'shift',
			events: {
				load: function() {
					// This will place the U2U logo in the bottom left of the graph.
					// Use the full URL from the hub so that if downloads the chart, the image will be saved correctly with the jpg/pdf
					// Note that as of 5/6/2016, the path was changed to relative. Logo will be drawn on web page but not in downloaded image file.
					//   This is due to security issues allowing a server at HighCharts to render the chart to an image file to be downloaded to disk.
					this.renderer.image('/app/site/groups/3048/components/com_purdue_gdd/assets/img/u2ulogo_smaller.png', 0, parseInt($(this.container).height() - 32) , 48, 33).add();
				}
			}
		},
		// Sets hover text over the "Chart Options" button
		lang: {
			contextButtonTitle: "Print or Download Chart Image"
		},
		// Sets save options for the chart including using the U2U image and save height/width
		// Note: all saves are rendered through the highcharts website and not within our site
		// This is part of the highcharts api, cannot be changed.
		exporting: {
			sourceWidth: 976,
			sourceHeight: 550,
			scale: 1,
			enableImages: true,
			buttons:
			{
				contextButton:
				{
					text: 'Chart Options'
				}
			}
		},
		title: {
			text: 'Corn Growing Degree Day Tool',
			style: {
				fontSize: '16px',
				color: '#274B6D'
				},
			x: -20 //center
		},
		credits: {
			text: 'GDD Base 50/86 (degrees F); Created: '.concat(today)
		},
		subtitle: {
			text: 'Location: '.concat(latitude.toFixed(2)).concat(', ').concat(longitude.toFixed(2)).concat(' in ').concat(county).concat(' Co., ').concat(state).concat(', Start Date: ').concat(document.getElementById('drop_months').options[document.getElementById('drop_months').selectedIndex].text).concat(' ').concat(day_for_date).concat(', Maturity Days: ').concat(day_for_maturity).concat(', Freeze Temp: ').concat(freeze_choice_value).concat('\u00B0F, Variation: ').concat(document.getElementById('drop_percentile').options[document.getElementById('drop_percentile').selectedIndex].text),
			style: {
				fontSize: '12px',
				color: '#4D759E'
				},
			x: -20,
			y: 35
		},
		xAxis: {
			min: 0,
			minPadding: 0,
			title:{
				text: xAxisTitle
			},
			// Set X axis to be datetime format and set the point and tick intervals to be months (by way of milliseconds)
			type: 'datetime',
			//min: 24 * 3600 * 1000 * 31,
			min: Date.UTC(graphYear, 1, 1),
			//max: 334 * 24 * 3600 * 1000,
			max: Date.UTC(graphYear, 11, 1),
			pointInterval: 24 * 3600 * 1000 * 31,
			tickInterval: 24 * 3600 * 1000 * 31,
			// Set minRange (maxZoom) to be one month (again, milliseconds)
			minRange: 24 * 3600 * 1000 * 31,
			labels: {
				// Set X axis labels to be custom.  Very simple, just returns the month name with the highcharts date format function.
				formatter: function() {
					var month = Highcharts.dateFormat('%B', this.value);
					return month;
				}
			}
		},
		yAxis: [{
			min: 0,
         max: axisMaxes[0],
         tickInterval: 500,
         tickAmount: axisMaxes[3],
         endOnTick: false,
			title: {
				text: 'Accumulated Corn GDD'
				},
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
				}],
			labels: {
				format: '{value:,.0f}'
				}
			},
			{
			min: 0,
			max: axisMaxes[1],
			endOnTick: false,
			tickInterval: axisMaxes[2],
         tickAmount: axisMaxes[3],
			minRange: 0.1,
			title: {
				text: 'Last Spring/First Fall Frost (# of years)'
				},
            opposite: true,
			}],
		series: chart_series,
		plotOptions:{
			series:{
				//pointStart: Date.UTC(graphYear, 0, 1),
				marker:{
					enabled: false
				},
				showCheckbox: true,
				events:{
					legendItemClick: function(event){
						var visibility = this.visible ? false : true;
						var show_silking_array = new Array();
						var show_black_layer_array = new Array();
						var show_last_freeze_array = new Array();
						var show_first_freeze_array = new Array();
						var show_average_array = new Array();
						var show_projection_array = new Array();
						//console.log(this.name);
						for(var i = 0; i < this.chart.series.length; i++){
							//console.log("i = " + i + " => " + this.chart.series[i].name);
							if(this.chart.series[i].name.indexOf("Silking") != -1 && this.chart.series[i].name.split(" ").length > 1){
								show_silking_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("Black") != -1 && this.chart.series[i].name.split(" ").length > 2){
								show_black_layer_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("Last Freeze Range") != -1){
								show_last_freeze_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("First Freeze Range") != -1){
								show_first_freeze_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("GDD Percentile Range") != -1){
								show_average_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("GDD Percentile Projected Range") != -1){
								show_projection_array.push(i);
							}
						}
						
						if(this.name == "Silking"){
							show_silking = visibility;
							show_silking_horizontal = visibility;
							/*this.chart.series[3].visible ? this.chart.series[3].hide() : this.chart.series[3].show();
							this.chart.series[4].visible ? this.chart.series[4].hide() : this.chart.series[4].show();
							this.chart.series[5].visible ? this.chart.series[5].hide() : this.chart.series[5].show();*/
							for(var i = 0; i < show_silking_array.length; i++){
								this.chart.series[show_silking_array[i]].visible ? this.chart.series[show_silking_array[i]].hide() : this.chart.series[show_silking_array[i]].show();
							}
						}
						else if(this.name == "Black Layer"){
							show_blacklayer = visibility;
							show_blacklayer_horizontal = visibility;
							/*this.chart.series[7].visible ? this.chart.series[7].hide() : this.chart.series[7].show();
							this.chart.series[8].visible ? this.chart.series[8].hide() : this.chart.series[8].show();
							this.chart.series[17].visible ? this.chart.series[17].hide() : this.chart.series[17].show();*/
							for(var i = 0; i < show_black_layer_array.length; i++){
								this.chart.series[show_black_layer_array[i]].visible ? this.chart.series[show_black_layer_array[i]].hide() : this.chart.series[show_black_layer_array[i]].show();
							}
						}
						else if(this.name == "Last Freeze (Spring)"){
							show_average_last_freeze = visibility;
							show_all_last_freezes = visibility;
							//this.chart.series[12].visible ? this.chart.series[12].hide() : this.chart.series[12].show();
							for(var i = 0; i < show_last_freeze_array.length; i++){
								this.chart.series[show_last_freeze_array[i]].visible ? this.chart.series[show_last_freeze_array[i]].hide() : this.chart.series[show_last_freeze_array[i]].show();
							}
						}
						else if(this.name == "First Freeze (Fall)"){
							show_average_first_freeze = visibility;
							show_all_first_freezes = visibility;
							//this.chart.series[13].visible ? this.chart.series[13].hide() : this.chart.series[13].show();
							for(var i = 0; i < show_first_freeze_array.length; i++){
								this.chart.series[show_first_freeze_array[i]].visible ? this.chart.series[show_first_freeze_array[i]].hide() : this.chart.series[show_first_freeze_array[i]].show();
							}
						}
						else if(this.name == "Avg. GDD (1991-2020)"){
							show_average = visibility;
							show_full_range = visibility;
							//this.chart.series[0].visible ? this.chart.series[0].hide() : this.chart.series[0].show();
							for(var i = 0; i < show_average_array.length; i++){
								this.chart.series[show_average_array[i]].visible ? this.chart.series[show_average_array[i]].hide() : this.chart.series[show_average_array[i]].show();
							}
						}
						else if(this.name == "Median GDD (1991-2020)"){
							show_median = visibility;
						}
						else if(this.name == gPrevYear + " GDD Projection" || this.name == gCurrentYear + " GDD Projection"){
							show_current_projection = visibility;
							show_projected_range = visibility;
							//this.chart.series[1].visible ? this.chart.series[1].hide() : this.chart.series[1].show();
							for(var i = 0; i < show_projection_array.length; i++){
								this.chart.series[show_projection_array[i]].visible ? this.chart.series[show_projection_array[i]].hide() : this.chart.series[show_projection_array[i]].show();
							}
						}
						else if(this.name == gPrevYear + " GDD" || this.name == gCurrentYear + " GDD"){
							show_current_year = visibility;
						}
						else{
							show_comparison_year = visibility;
						}
						//Affect checkbox for this item
						this.select();
					},
					checkboxClick: function(event) {
						//Hide/Show Series
						this[ this.visible ? 'hide' : 'show' ]();
						//Update Checkbox
						this.select();

						//Take care of related items
						var visibility = this.visible;
						var name = event.target.name;
						var show_silking_array = new Array();
						var show_black_layer_array = new Array();
						var show_last_freeze_array = new Array();
						var show_first_freeze_array = new Array();
						var show_average_array = new Array();
						var show_projection_array = new Array();
						//console.log(this.name);
						for(var i = 0; i < this.chart.series.length; i++){
							//console.log("i = " + i + " => " + this.chart.series[i].name);
							if(this.chart.series[i].name.indexOf("Silking") != -1 && this.chart.series[i].name.split(" ").length > 1){
								show_silking_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("Black") != -1 && this.chart.series[i].name.split(" ").length > 2){
								show_black_layer_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("Last Freeze Range") != -1){
								show_last_freeze_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("First Freeze Range") != -1){
								show_first_freeze_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("GDD Percentile Range") != -1){
								show_average_array.push(i);
							}
							else if(this.chart.series[i].name.indexOf("GDD Percentile Projected Range") != -1){
								show_projection_array.push(i);
							}
						}

						if(name == "Silking"){
							show_silking = visibility;
							show_silking_horizontal = visibility;
							for(var i = 0; i < show_silking_array.length; i++){
								this.chart.series[show_silking_array[i]].visible ? this.chart.series[show_silking_array[i]].hide() : this.chart.series[show_silking_array[i]].show();
							}
						}
						else if(name == "Black Layer"){
							show_blacklayer = visibility;
							show_blacklayer_horizontal = visibility;
							for(var i = 0; i < show_black_layer_array.length; i++){
								this.chart.series[show_black_layer_array[i]].visible ? this.chart.series[show_black_layer_array[i]].hide() : this.chart.series[show_black_layer_array[i]].show();
							}
						}
						else if(name == "Last Freeze (Spring)"){
							show_average_last_freeze = visibility;
							show_all_last_freezes = visibility;
							for(var i = 0; i < show_last_freeze_array.length; i++){
								this.chart.series[show_last_freeze_array[i]].visible ? this.chart.series[show_last_freeze_array[i]].hide() : this.chart.series[show_last_freeze_array[i]].show();
							}
						}
						else if(name == "First Freeze (Fall)"){
							show_average_first_freeze = visibility;
							show_all_first_freezes = visibility;
							for(var i = 0; i < show_first_freeze_array.length; i++){
								this.chart.series[show_first_freeze_array[i]].visible ? this.chart.series[show_first_freeze_array[i]].hide() : this.chart.series[show_first_freeze_array[i]].show();
							}
						}
						else if(name == "Avg. GDD (1991-2020)"){
							show_average = visibility;
							show_full_range = visibility;
							for(var i = 0; i < show_average_array.length; i++){
								this.chart.series[show_average_array[i]].visible ? this.chart.series[show_average_array[i]].hide() : this.chart.series[show_average_array[i]].show();
							}
						}
						else if(name == "Median GDD (1991-2020)"){
							show_median = visibility;
						}
						else if(name == gPrevYear + " GDD Projection" || this.name == gCurrentYear + " GDD Projection"){
							show_current_projection = visibility;
							show_projected_range = visibility;
							for(var i = 0; i < show_projection_array.length; i++){
								this.chart.series[show_projection_array[i]].visible ? this.chart.series[show_projection_array[i]].hide() : this.chart.series[show_projection_array[i]].show();
							}
						}
						else if(name == gPrevYear + " GDD" || this.name == gCurrentYear + " GDD"){
							show_current_year = visibility;
						}
						else{
							show_comparison_year = visibility;
						}
						event.preventDefault();
					}
				}
			}
		},
		legend: chart_legend,
		tooltip: {
			formatter: function() {
				//var index = (this.x/86400000);
				var index = getDayOfYearFromMilliseconds(this.x);
				//console.log("gdd::Highcharts->index: " + index);
				//console.log("gdd::Highcharts->this.x: " + this.x);
				var forecastEnd = current_year_data.length + forecast_data_display;
				if(this.series.name == "Last Freeze (Spring)" || this.series.name == "First Freeze (Fall)"){
					return Highcharts.dateFormat('%B %e', this.x) +'<br/><span style="color:'+this.series.color+'">Average '+ this.series.name + '</span>'; }
				else if(this.series.name == "Last Freeze Range"){
					return Highcharts.dateFormat('%B %e', this.x) +'<br/><span style="color:'+this.series.color+'">'+ this.series.name + '</span><br/>Years: <b>' + last_freeze_strings[index] + '</b>'; }
				else if(this.series.name == "First Freeze Range"){
					return Highcharts.dateFormat('%B %e', this.x) +'<br/><span style="color:'+this.series.color+'">'+ this.series.name + '</span><br/>Years: <b>' + first_freeze_strings[index] + '</b>'; }
				else if(this.series.name == "Silking" || this.series.name == "Silking Earliest" || this.series.name == "Silking Latest" || this.series.name == "Black Layer" || this.series.name == "Black Layer Earliest" || this.series.name == "Black Layer Latest") {
					return Highcharts.dateFormat('%B %e', this.x) +'<br/><span style="color:'+this.series.color+'">'+ this.series.name + '</span>'; }
				else if(this.series.name == "Silking Horizontal"){
					return '<span style="color:'+this.series.color+'">'+ 'Silking Value' + '</span>: <b>' + this.y + '</b>'; }
				else if(this.series.name == "Black Layer Horizontal"){
					return '<span style="color:'+this.series.color+'">'+ 'Black Layer Value' + '</span>: <b>' + this.y + '</b>'; }
				else if(this.series.name == gPrevYear + " GDD Projection" || this.series.name == gCurrentYear + " GDD Projection"){
					sublabel = index < forecastEnd ? 'GDD Projection <br />(NWS/CFS Forecast)' : 'GDD Projection <br />(based on 30-year history)';
					return Highcharts.dateFormat('%B %e', this.x) +' - '+sublabel+'</span>: <b>' + this.y + '</b>';}
				else if(this.series.name == "GDD Percentile Projected Range"){
					sublabel = index < forecastEnd ? 'GDD Projected Range <br />(NWS/CFS Forecast)' : 'GDD Percentile Projected Range <br />(based on 30-year history)';
					return Highcharts.dateFormat('%B %e', this.x) +' - '+sublabel+'</span>: <b>' + this.point.low + ' - ' + this.point.high + '</b>';}
				else if(this.series.name == "GDD Percentile Range"){
					return Highcharts.dateFormat('%B %e', this.x) +'<br/>GDD Percentile Range' + '</span>: <b>' + this.point.low + ' - ' + this.point.high + '</b>';}
				return Highcharts.dateFormat('%B %e', this.x) +'<br/><span style="color:'+this.series.color+'">'+ this.series.name + '</span>: <b>' + this.y + '</b>';
			}
		}
	});

	if(state == '' || county == ''){
		gHighchart.setTitle({text: 'Corn Growing Degree Day Tool'},{text: 'Location: '.concat(latitude.toFixed(2)).concat(', ').concat(longitude.toFixed(2)).concat(', Start Date: ').concat(document.getElementById('drop_months').options[document.getElementById('drop_months').selectedIndex].text).concat(' ').concat(day_for_date).concat(', Maturity Days: ').concat(day_for_maturity).concat(', Freeze Temp: ').concat(freeze_choice_value).concat('\u00B0F, Variation: ').concat(document.getElementById('drop_percentile').options[document.getElementById('drop_percentile').selectedIndex].text)});
	}
	
	//for(var i = 0; i < highchart.legend.allItems.length; i++){console.log("i = " + i + " and name = " + highchart.legend.allItems[i].name);}
	// If "current day" is anytime in previous year, make sure the legend and series titles match
	if (currentYearCode == 2) {
		gHighchart.legend.allItems[0].update({name: gPrevYear + ' GDD'});
		gHighchart.legend.allItems[1].update({name: gPrevYear + ' GDD Projection'});
		}
	else{
		gHighchart.legend.allItems[0].update({name: gCurrentYear + ' GDD'});
		gHighchart.legend.allItems[1].update({name: gCurrentYear + ' GDD Projection'});
		} 

		// Used for intro.js (inline help) to get help for legend and chart options which are part of the graph.
	var container = gHighchart.container.id; // gHighchart.container.id   'graph_element'
    var offsetTop = (document.getElementById(container)).offsetTop;
    var offsetLeft = (document.getElementById(container)).offsetLeft;
    //console.log(offsetTop);
    //console.log(offsetLeft);
	var x = 755;	// 8
	var y = 10;	// 275
	var width = 117;
	var height = 25;
	html = '<div data-chart="'+container+'" data-intro-disabled="Print or download this graphic in a variety of formats using Chart Options." data-position="left" style="position:absolute; z-index:-10 !important; left:'+x+'px; top:'+y+'px; height:'+height+'px; width:'+width+'px;"></div>';
	
	x = gHighchart.legend.box.parentGroup.translateX;
	y = gHighchart.legend.box.parentGroup.translateY;
	width = gHighchart.legend.legendWidth;
	height = gHighchart.legend.legendHeight;

	//Move the label checkboxes - default is to have them after the label, no config on highcharts to do this for us
	$.each(gHighchart.legend.allItems, function(i, item){
			var $check = $(item.checkbox);
			$check.css({'left': '94px', 'z-index':'0'});
			if (mapping.mobileUser)
				$check.css({'margin-top': '5px'});
  });

  $.each(gHighchart.series, function(i) {
		if ( gHighchart.series[i].legendSymbol ){
      gHighchart.series[i].legendSymbol.attr({
          translateX: 22
      });
    }
    if ( gHighchart.series[i].legendLine ){
      gHighchart.series[i].legendLine.attr({
          translateX: 22
      });
    }
    if ( gHighchart.series[i].legendItem ){
      gHighchart.series[i].legendItem.attr({
          translateX: 22
      });
    }
  });

	//Add Touch (Mobile) Event for checkboxes, normally this is cancelled by the highcharts JS
	$.each(gHighchart.legend.allItems, function(i, item){
		$(item.checkbox).bind('touchstart',  function (event) {
			$(item).trigger('checkboxClick');
			event.preventDefault();
		});
	});
	html += '<div data-chart="'+container+'" data-intro-disabled="Add or remove lines on the graph by clicking on the corresponding items in the legend." style="position:absolute; z-index:-10 !important; left:'+x+'px; top:'+y+'px; height:'+height+'px;width:'+width+'px"></div>';
	$('#'+container).prepend(html);
	//console.log(gHighchart);

};

function customSilkingAndBlacklayer(){
	var cornMaturityDropdown = document.getElementById('drop_maturity');
	cornMaturityDropdown.options[cornMaturityDropdown.options.length-1].selected = true;
	setSelectedIndexGraph();
	refreshSelectedIndexData();
	determine_silk_blacklayer();
}

function customSilkingAndBlacklayerData() {
	var cornMaturityDropdownData = document.getElementById('drop_maturityData');
	cornMaturityDropdownData.options[cornMaturityDropdownData.options.length-1].selected = true; 
	setSelectedIndexData();
	refreshSelectedIndexGraph();
	updateDataTab();
}

function dateFromDay(year, day){
  var date = new Date(year, 0); // initialize a date in `year-01-01`
  return new Date(date.setDate(day)); // add the number of days
}	// end "dateFromDay"

function dataLoadFailure(){
        // Stop timeout functions
	//console.log("data load failure");
    clearTimeout(cancel_request)
	$('#circularG').hide();
    $('.cancel_request').hide();
    alert("The data files could not be read. Try again later or report the problem using the 'NEED HELP' link above - right.");
}

function dataLoadSuccess(){
	//console.log("data load success");
	//console.log("allGDD.length: "+allGDD.length);
	//console.log("orig_all_min_data.length: "+orig_all_min_data.length);
	//console.log("orig_current_year_data.length: "+orig_current_year_data.length);
	//console.log("minimum_current_data.length: "+minimum_current_data.length);
	//console.log("minimum_previous_data.length: "+minimum_previous_data.length);
	
	var previous_year_data_flag = true;
	if (!gHistoricalDataIncludesPreviousYearFlag && orig_previous_year_data.length <= 1) {
		previous_year_data_flag = false; }
	
	if (allGDD.length > 1 && orig_all_min_data.length > 1 && orig_current_year_data.length > 1 && 
			minimum_current_data.length > 1 && minimum_previous_data.length > 1 && previous_year_data_flag) {
		loadData();
		gNewDataLoadedFlag = true;
		
			// Stop timeout functions
		clearTimeout(cancel_request);
		$('#circularG').hide();
		$('.cancel_request').hide();
	
			// Show the graph and data tabs
		jQuery('#graph_tab').show();
		jQuery('#data_tab').show();
    	//console.log("ready to call tagContent");
		selectTag('tagContent1', document.getElementById('graph_tab'));

		$('html, body').animate({
	    scrollTop: $("#con").offset().top
		}, 500);
		}	// end "if (allGDD.length > 1 && ..."
	else {
		alert("The server with the input gdd data files is not accessible. Try again later or report the problem using the 'NEED HELP' link above - right."); 
		clearTimeout(cancel_request);
		$('#circularG').hide();
		$('.cancel_request').hide();
		}
}


/**
*  determine_freeze
*  All freeze dates are calculated and plopped into arrays for display on the graph
*  Arrays for average first and last freezes as well as arrays for each first and last freeze for each year exist
**/
function determine_freeze(){
	last_freeze_point = 0;
	// Re-initialize all arrays to empty in case there is data in them
	for(var i = 0; i < 365; i++){
		last_freeze[i] = 0;
		first_freeze[i] = 0;
		all_last_freezes[i] = 0;
		all_first_freezes[i] = 0;
		last_freeze_count[i] = 0;
		first_freeze_count[i] = 0;
		last_freeze_strings[i] = "";
		first_freeze_strings[i] = "";
	}
	// Get the freeze temperature selection from the dropdown menu
	var drop_freeze = document.getElementById('drop_freeze');
	var freeze_value = parseInt(drop_freeze.options[drop_freeze.selectedIndex].text);
	freeze_choice_value = freeze_value;
	
	// Get percentile variation selection from dropdown menu
	var drop_percentile = document.getElementById('drop_percentile');
	var percentile_value = drop_percentile.options[drop_percentile.selectedIndex].value;
	//all_min_data includes averages at the head of each year, so add 1
	var allFreezeDataYears = gFreezeDataYears + 1;
	var freezeSelectionSize = allFreezeDataYears * 2;
	var workingYear = getWorkingYear ();
	var index;
	
	// Get min data for the correct freeze temperature
	var temp_min = all_min_data.slice(freezeSelectionSize*freeze_choice_index, freezeSelectionSize+freeze_choice_index*freezeSelectionSize);
	// Get average last freeze (array index 0)
	average1981_2010YearLastFreeze = parseInt(temp_min.slice(0,1));
	//console.log ("File Average 1981-2010 Last Freeze: ", average30YearLastFreeze);
	var average = 0;
	for (var i = gHistoryIndexStart+1; i <= gHistoryIndexEnd; i++){
		average += parseInt(temp_min[i]);
		}
	average /= 30;
	//console.log ("Computed Average Last Freeze: ", average);
	average30YearLastFreeze = Math.round(average);
	//console.log ("average30YearLastFreeze: ", average30YearLastFreeze);
	// Allow for index of 0 being day of year 1
	//index = parseInt(temp_min.slice(0,1));
	index = average30YearLastFreeze;
	if (isLeapYear(workingYear) && index > 60)
		index += 1;
	last_freeze[index-1] = 7.5;
	// Get average first freeze (array index of gFreezeDataYears + 1, after all last freeze years)
	average1981_2010YearFirstFreeze = parseInt(temp_min.slice(allFreezeDataYears,allFreezeDataYears+1));
	//console.log ("File Average 1981-2010 First Freeze: ", average30YearFirstFreeze);
	var average = 0;
	var startIndex = allFreezeDataYears + gHistoryIndexStart + 1;
	var endIndex = allFreezeDataYears + gHistoryIndexEnd + 1;
	//console.log ("Start Index: ", startIndex);
	//console.log ("End Index: ", endIndex);
	for (var i = startIndex; i < endIndex; i++){
		//console.log ("temp_min[i]: ", i, temp_min[i]);
		average += parseInt(temp_min[i]);
		}
	average /= 30;
	average30YearFirstFreeze = Math.round(average);
	//console.log ("allFreezeDataYears: ", allFreezeDataYears);
	//console.log ("Computed Average First Freeze: ", average);
	//console.log ("average30YearFirstFreeze: ", average30YearFirstFreeze);
	// Allow for index of 0 being day of year 1
	//index = parseInt(temp_min.slice(allFreezeDataYears,allFreezeDataYears+1));
	index = average30YearFirstFreeze;
	if (isLeapYear(workingYear) && index > 60)
		index += 1;
	first_freeze[index-1] = 7.5;
	
	// Parse all last freezes and assign correct counts and string values
	for(var i = 1; i < allFreezeDataYears; i++){
		var temp_point = parseInt(temp_min.slice(i, i+1));
		if (isLeapYear(workingYear) && temp_point > 60)
			temp_point += 1;
		if(temp_point > last_freeze_point){
			last_freeze_point = temp_point;
		}
		all_last_freezes[temp_point - 1] += 1;	// 500
		last_freeze_count[temp_point - 1] = last_freeze_count[temp_point - 1] + 1;
		if(last_freeze_strings[temp_point - 1] == ""){
			last_freeze_strings[temp_point - 1] = (i + 1980).toString();
		}
		else{
			last_freeze_strings[temp_point - 1] = last_freeze_strings[temp_point - 1].concat(", ").concat((i + 1980).toString());
		}
	}
	// Parse all first freezes and assign correct counts and string values
	for(var i = allFreezeDataYears+1; i < freezeSelectionSize; i++){
		var temp_point = parseInt(temp_min.slice(i, i+1));
		if (isLeapYear(workingYear) && temp_point > 60)
			temp_point += 1;
		all_first_freezes[temp_point - 1] += 1; // 500
		first_freeze_count[temp_point - 1] = first_freeze_count[temp_point - 1] + 1;
		if(first_freeze_strings[temp_point - 1] == ""){
			first_freeze_strings[temp_point - 1] = ((i-allFreezeDataYears) + 1980).toString();
		}
		else{
			first_freeze_strings[temp_point - 1] = first_freeze_strings[temp_point - 1].concat(", ").concat(((i-allFreezeDataYears) + 1980).toString());
		}
	}

	// Get count for the total freeze years we have data for
	var count = 0;
	for(var i = 181; i < 365; i++){
		count = count + parseInt(first_freeze_count[i]);
	}
	
	// With regards to percentile choice, show only X amount of freezes
	var decrement_value = 0;
	var cut_beginning = 0;
	var cut_end = 0;
	// No variation displayed
	if(percentile_value == 3){
		no_variation = true;
		for(var i = 0; i < 365; i++){
			all_last_freezes[i] = 0;
			all_first_freezes[i] = 0;
		}
		//chart();
		return;
	}
	// Middle 10 years
	else if(percentile_value == 2){
		no_variation = false;
		decrement_value = Math.round(count * 0.33);
		cut_beginning = decrement_value;
		cut_end = decrement_value;
	}
	// Middle 20 years
	else if(percentile_value == 1){
		no_variation = false;
		decrement_value = Math.round(count * 0.16);
		cut_beginning = decrement_value;
		cut_end = decrement_value;
	}
	// All years
	else{
		no_variation = false;
		cut_beginning = 0;
		cut_end = 0;
		// Make a copy of the freeze arrays to be used with the data tab
		all_last_freezes_data = all_last_freezes.slice();
		all_first_freezes_data = all_first_freezes.slice();
		// No more calulations are needed if all years are selected.
		return;
	}
	
	// Strip off correct amount of freeze values from beginning of the year (last freeze)
	for(var i = 0; i < 181; i++){
		if(all_last_freezes[i] != 0){
			// While the date still has freeze years available, decrement the count
			while(last_freeze_count[i] != 0){
				if(cut_beginning == 0){
					break;
				}
				last_freeze_count[i] = last_freeze_count[i] - 1;
				cut_beginning = cut_beginning - 1;
			}
			// If count for that day reaches 0, set value at that array index to 0 as well.  Also, if the amount to cut off is 0, break out of the loop
			if(cut_beginning == 0 && last_freeze_count[i] == 0){
				all_last_freezes[i] = 0;
				break;
			}
			
			// If count for amount to strip off of the beginning reaches 0, break
			if(cut_beginning == 0){
				break;
			}
			
			// If count for that day reaches 0, set value of the array at that index to 0
			if(last_freeze_count[i] == 0){
				all_last_freezes[i] = 0;
			}
		}
	}
	// Reset the counts for stripping off values
	cut_beginning = decrement_value;
	cut_end = decrement_value;
	// Strip off values from middle of the year (last freeze) and move backward
	for(var i = 180; i >= 0; i--){
		// For information about ongoings of this for loop, see similar loop above
		if(all_last_freezes[i] != 0){
			while(last_freeze_count[i] != 0){
				if(cut_beginning == 0){
					break;
				}
				last_freeze_count[i] = last_freeze_count[i] - 1;
				cut_beginning = cut_beginning - 1;
			}
			if(cut_beginning == 0 && last_freeze_count[i] == 0){
				all_last_freezes[i] = 0;
				break;
			}
			
			if(cut_beginning == 0){
				break;
			}
			
			if(last_freeze_count[i] == 0){
				all_last_freezes[i] = 0;
			}
		}
	}
	// Reset decrement values again
	cut_beginning = decrement_value;
	cut_end = decrement_value;
	// Strip off values from middle of first freezes and move to end of the year
	for(var i = 181; i < 365; i++){
		// For information about ongoings of this for loop, see similar loop above
		if(all_first_freezes[i] != 0){
			while(first_freeze_count[i] != 0){
				if(cut_end == 0){
					break;
				}
				first_freeze_count[i] = first_freeze_count[i] - 1;
				cut_end = cut_end - 1;
			}
			if(cut_end == 0 && first_freeze_count[i] == 0){
				all_first_freezes[i] = 0;
				break;
			}
			if(cut_end == 0){
				break;
			}
			if(first_freeze_count[i] == 0){
				all_first_freezes[i] = 0;
			}
		}				
	}
	// Reset decrement values again
	cut_beginning = decrement_value;
	cut_end = decrement_value;
	// Strip off values from end of first freezes and move to middle of the year
	for(var i = 364; i > 180; i--){
		// For information about ongoings of this for loop, see similar loop above
		if(all_first_freezes[i] != 0){
			while(first_freeze_count[i] != 0){
				if(cut_end == 0){
					break;
				}
				first_freeze_count[i] = first_freeze_count[i] - 1;
				cut_end = cut_end - 1;
			}
			if(cut_end == 0 && first_freeze_count[i] == 0){
				all_first_freezes[i] = 0;
				break;
			}
			if(cut_end == 0){
				break;
			}
			if(first_freeze_count[i] == 0){
				all_first_freezes[i] = 0;
			}
		}
	}
	
	// Make a copy of the freeze arrays to be used with the data tab
	all_last_freezes_data = all_last_freezes.slice();
	all_first_freezes_data = all_first_freezes.slice();
}
/*** End determine_freeze() ***/

/***
* determine_last_freeze_visibility()
*
* This function will determine whether to display the last spring freeze lines by default or not.
* If the current day is before the last freeze point (or within 14 days after that point) then show the lines.
* Otherwise disable them by default.
*
***/
function determine_last_freeze_visibility(){
	// Determine last freeze (spring) and current day - set bool accordingly
	var now;
	var start;

	// Handle case where the year may have rolled over to a new year and tool has not been set up yet for 
	// the new year.
	if (systemYear > gCurrentYear) {
		now = new Date(gCurrentYear, 12-1, 31, 0, 0, 0);
		start = new Date(gCurrentYear, 0, 0);
	}
	else {
		now = new Date();
		start = new Date(systemYear, 0, 0);
	}
	var diff = now - start;
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff/oneDay);
	
	// If current_day is > 0, that means we have chosen a previous date to be the 'current day'
	// If current_day = -1, then it will actually be the current day of the year
	if(current_day > 0){
		if((parseInt(last_freeze_point)+14) < parseInt(current_day)){
			show_average_last_freeze = false;
			show_all_last_freezes = false;
		}
		else{
			show_average_last_freeze = true;
			show_all_last_freezes = true;
		}
	}
	// current_day is -1 so use today's date to compare to the last freeze date
	else if((parseInt(last_freeze_point)+14) < parseInt(day)) {
		show_average_last_freeze = false;
		show_all_last_freezes = false;
	}
	else{
		show_average_last_freeze = true;
		show_all_last_freezes = true;
	}
	// end determine freeze visibility
}

/***
* determine_silk_blacklayer
* Function that calculates the silking and blacklayers information (dates, ranges) for use with the graph and data tab
***/
function determine_silk_blacklayer(){
	// Set up range arrays for both silking and black layer data
	blacklayer_low_range = new Array();
	blacklayer_high_range = new Array();
	silking_low_range = new Array();
	silking_high_range = new Array();
	// Re-initialize silk and black layer date array to 0
	for(var i = 0; i < 365; i++){
		silk[i] = 0;
		blacklayer[i] = 0;
		}
	silking_horizontal = new Array(365);
	blacklayer_horizontal = new Array(365);
	
		// Get maturity selection from dropdown
	var drop_maturity = document.getElementById('drop_maturity');
	var maturity_value = drop_maturity.options[drop_maturity.selectedIndex].text;
		// Set maturity value for titles in graph
	day_for_maturity = maturity_value;
	// Calculate silk value and black layer value
	//gdd_silk = (11.459 * parseInt(maturity_value)) + 100.27;
	//gGDD_vn[gSilkingIndex] = gdd_silk;
	//gdd_blacklayer = (24.16 * parseInt(maturity_value)) - 15.388;
	//gGDD_vn[gBlacklayerIndex] = gdd_blacklayer;
	
	var found_silk = false;
	var found_blacklayer = false;
	var found_range = 0;
	// Search current year GDD to see if we find silk date
	for(var i = 0; i < current_year_data.length; i++){
		if(current_year_data[i] > gdd_silk){
			silk[i] = current_year_data[i];
			gVnDayOfYear[gSilkingIndex] = i + 1;
			found_silk = true;
			// Make sure we set the horizontal line as well
			for(var j = 0; j < i+1; j++){
				silking_horizontal[j] = current_year_data[i];
			}
			break;
		}
	}
	// If we haven't found the silking point yet, look at the projection line/range
	if(!found_silk){
		for(var i = 0; i < current_year_projection.length; i++){
			// Check if projection point is greater than silk calculation
			if(current_year_projection[i][1] > gdd_silk){
				found_silk = true;
				// Set silk point (i + the length of current year to date)
				silk[i+current_year_data.length] = current_year_projection[i][1];
				gVnDayOfYear[gSilkingIndex] = current_year_data.length + i;
				for(var j = plot_range_projection.length-1; j>0; j--){
					try{
						// If any variation is selected via dropdown, get points for earliest silking date
						if(plot_range_projection[j][2] < gdd_silk && !no_variation){
							//add point
							for(var k = 0; k*5 < gdd_silk; k++){
								silking_low_range.push([plot_range_projection[j+1][0], k*5]);
							}
							silking_low_range.push([plot_range_projection[j+1][0], current_year_projection[i][1]]);
							break;
						}
					}catch(err){break;}
				}
				for(var j = 0; j<plot_range_projection.length; j++){
					try{
						// If any variation is selected via dropdown, get points for latest silking date
						if(plot_range_projection[j][1] > gdd_silk && !no_variation){
							//add point
							for(var k = 0; k*5 < gdd_silk; k++){
								silking_high_range.push([plot_range_projection[j][0], k*5]);
							}
							silking_high_range.push([plot_range_projection[j][0], current_year_projection[i][1]]);
							found_range = getDayOfYearFromMilliseconds (plot_range_projection[j][0]);
							break;
						}
					}catch(err){break;}
				}
				// Make sure we extend the silking horizontal line to the latest silking date (for aesthetic purposes)
				found_range = Math.min(364, found_range);
				if(found_range != 0){
					for(var j = 0; j < found_range + 1; j++){
						silking_horizontal[j] = current_year_projection[i][1];
					}
				}
				else{
					for(var j = 0; j < i+current_year_data.length+1; j++){
						silking_horizontal[j] = current_year_projection[i][1];
					}
				}
				break;
			}
		}
	}
	// Silking still wasn't found in the projection either.  Draw the horizontal line where GDD would have to hit
	if(!found_silk){
		gVnDayOfYear[gSilkingIndex] = -1;
		for(var i = 0; i < 365; i++){
			silking_horizontal[i] = gdd_silk;
		}
		//  Check for earliest silking date still for the dotted vertical line
		for(var j = 0; j<plot_range_projection.length; j++){
			try{
				if(plot_range_projection[j][2] > gdd_silk){
					//add point
					for(var k = 0; k*5 < gdd_silk; k++){
						silking_low_range.push([plot_range_projection[j+1][0], k*5]);
					}
					silking_low_range.push([plot_range_projection[j+1][0], gdd_silk]);
					break;
				}
			}catch(err){break;}
		}
	}
	
	//  The black layer logic below is the same as the silk logic above.  See above for comments if needed.
	found_range = 0;
	for(var i = 0; i < current_year_data.length; i++){
		if(current_year_data[i] > gdd_blacklayer){
			blacklayer[i] = current_year_data[i];
			found_blacklayer = true;
			gVnDayOfYear[gBlacklayerIndex] = i + 1;
			for(var j = 0; j < i+1; j++){
				blacklayer_horizontal[j] = current_year_data[i];
			}
			break;
		}
	}

	if(!found_blacklayer){
		for(var i = 0; i < current_year_projection.length; i++){
			if(current_year_projection[i][1] > gdd_blacklayer){
				found_blacklayer = true;
				gVnDayOfYear[gBlacklayerIndex] = current_year_data.length + i;
				blacklayer[i+current_year_data.length] = current_year_projection[i][1];
				for(var j = plot_range_projection.length-1; j>0; j--){
					try{
						if(plot_range_projection[j][2] < gdd_blacklayer && !no_variation){
							//add point
							for(var k = 0; k*5 < gdd_blacklayer; k++){
								blacklayer_low_range.push([plot_range_projection[j+1][0], k*5]);
							}
							blacklayer_low_range.push([plot_range_projection[j+1][0], current_year_projection[i][1]]);
							break;
						}
					}catch(err){break;}
				}
				for(var j = 0; j<plot_range_projection.length; j++){
					try{
						//console.log("plot_range_projection[j][1]: " + plot_range_projection[j][1]);
						//console.log("gdd_blacklayer: " + gdd_blacklayer);
						//console.log("no_variation: " + no_variation);
						if(plot_range_projection[j][1] > gdd_blacklayer && !no_variation){
							//add point
							for(var k = 0; k*5 < gdd_blacklayer; k++){
								blacklayer_high_range.push([plot_range_projection[j][0], k*5]);
							}
							blacklayer_high_range.push([plot_range_projection[j][0], current_year_projection[i][1]]);
							found_range = getDayOfYearFromMilliseconds (plot_range_projection[j][0]);
							break;
						}
					}catch(err){break;}
				}
				
				found_range = Math.min(364, found_range);
				if(found_range != 0){
					for(var j = 0; j < found_range + 1; j++){
						blacklayer_horizontal[j] = current_year_projection[i][1];
					}
				}
				else{
					for(var j = 0; j < i+current_year_data.length+1; j++){
						blacklayer_horizontal[j] = current_year_projection[i][1];
					}
				}
				break;
			}
		}
	}

	if(!found_blacklayer){
		gVnDayOfYear[gBlacklayerIndex] = 366;
		for(var i = 0; i < 365; i++){
			blacklayer_horizontal[i] = gdd_blacklayer;
		}
		for(var j = 0; j<plot_range_projection.length; j++){
			try{
				if(plot_range_projection[j][2] > gdd_blacklayer){
					//add point
					for(var k = 0; k*5 < gdd_blacklayer; k++){
						blacklayer_low_range.push([plot_range_projection[j+1][0], k*5]);
					}
					blacklayer_low_range.push([plot_range_projection[j+1][0], gdd_blacklayer]);
					break;
				}
			}catch(err){break;}
		}
	}
	
	// Larry Biehl
	// The following line turns on the similar year feature for the comparison years drop down menu.
	// It was recommended that this feature be turned off in 2015 because of possible confusion with thinking it means
	// similar in accumulated gdds and weather; i.e. similar in all ways. Not so sure this is a good conclusion to 
	// turn off.
	findSimilarGDDYears(start_date-1);
	
	// Once finished calculating and finding silk/black layer, redraw the graph
	//chart();
}	// end "determine_silk_blacklayer"


function determine_vegetationstages_date (plantingDayOfYear, currentDay, current_year_from_planting_date_gdds, current_year_projection){
	
	//console.log("In determine_vegetationstages_date");
		// Search current year GDDs to see if we find vn dates.
	var found_emergence_flag = false;
	var found_v2_flag = false;
	var found_v4_flag = false;
	var found_v6_flag = false;
	var found_v8_flag = false;
	var found_v10_flag = false;
	var found_silking_flag = false;
	var found_blacklayer_flag = false;
	
	var found_earliest_emergence_flag = false;
	var found_earliest_v2_flag = false;
	var found_earliest_v4_flag = false;
	var found_earliest_v6_flag = false;
	var found_earliest_v8_flag = false;
	var found_earliest_v10_flag = false;
	var found_earliest_silking_flag = false;
	var found_earliest_blacklayer_flag = false;
	
	var found_latest_emergence_flag = false;
	var found_latest_v2_flag = false;
	var found_latest_v4_flag = false;
	var found_latest_v6_flag = false;
	var found_latest_v8_flag = false;
	var found_latest_v10_flag = false;
	var found_latest_silking_flag = false;
	var found_latest_blacklayer_flag = false;
	
	for (var i=0; i<8; i++){
        gVnEarliestDayOfYear[i] = 366;
		gVnDayOfYear[i] = 366;
        gVnLatestDayOfYear[i] = 366;
        }
		
	//console.log("plantingDayOfYear: "+plantingDayOfYear);
	//console.log("currentDay: "+currentDay);
	//console.log("current_year_from_planting_date_gdds: "+current_year_from_planting_date_gdds);
	//console.log("current_year_projection: "+current_year_projection);
	
	var startIndex = plantingDayOfYear - 1;
	var endIndex = currentDay - 2;
	for(var i=startIndex; i<=endIndex; i++){
		if(!found_emergence_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gEmergenceIndex]){
			gVnDayOfYear[gEmergenceIndex] = i+1;
            gVnEarliestDayOfYear[gEmergenceIndex] = gVnDayOfYear[gEmergenceIndex];
            gVnLatestDayOfYear[gEmergenceIndex] = gVnDayOfYear[gEmergenceIndex];
			found_emergence_flag = true;
			found_earliest_emergence_flag = true;
			found_latest_emergence_flag = true;
			}
			
		else if(!found_v2_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gV2Index]){
			gVnDayOfYear[gV2Index] = i+1;
            gVnEarliestDayOfYear[gV2Index] = gVnDayOfYear[gV2Index];
            gVnLatestDayOfYear[gV2Index] = gVnDayOfYear[gV2Index];
			found_v2_flag = true;
			found_earliest_v2_flag = true;
			found_latest_v2_flag = true;
			}
			
		else if(!found_v4_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gV4Index]){
			gVnDayOfYear[gV4Index] = i+1;
            gVnEarliestDayOfYear[gV4Index] = gVnDayOfYear[gV4Index];
            gVnLatestDayOfYear[gV4Index] = gVnDayOfYear[gV4Index];
			found_v4_flag = true;
			found_earliest_v4_flag = true;
			found_latest_v4_flag = true;
			}
			
		else if(!found_v6_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gV6Index]){
			gVnDayOfYear[gV6Index] = i+1;
            gVnEarliestDayOfYear[gV6Index] = gVnDayOfYear[gV6Index];
            gVnLatestDayOfYear[gV6Index] = gVnDayOfYear[gV6Index];
			found_v6_flag = true;
			found_earliest_v6_flag = true;
			found_latest_v6_flag = true;
			}
			
		else if(!found_v8_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gV8Index]){
			gVnDayOfYear[gV8Index] = i+1;
            gVnEarliestDayOfYear[gV8Index] = gVnDayOfYear[gV8Index];
            gVnLatestDayOfYear[gV8Index] = gVnDayOfYear[gV8Index];
			found_v8_flag = true;
			found_earliest_v8_flag = true;
			found_latest_v8_flag = true;
			}
			
		else if(!found_v10_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gV10Index]){
			gVnDayOfYear[gV10Index] = i+1;
            gVnEarliestDayOfYear[gV10Index] = gVnDayOfYear[gV10Index];
            gVnLatestDayOfYear[gV10Index] = gVnDayOfYear[gV10Index];
			found_v10_flag = true;
			found_earliest_v10_flag = true;
			found_latest_v10_flag = true;
			}
			
		else if(!found_silking_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gSilkingIndex]){
			gVnDayOfYear[gSilkingIndex] = i+1;
            gVnEarliestDayOfYear[gSilkingIndex] = gVnDayOfYear[gSilkingIndex];
            gVnLatestDayOfYear[gSilkingIndex] = gVnDayOfYear[gSilkingIndex];
			found_silking_flag = true;
			found_earliest_silking_flag = true;
			found_latest_silking_flag = true;
			}
			
		else if(!found_blacklayer_flag && current_year_from_planting_date_gdds[i] >= gGDD_vn[gBlacklayerIndex]){
			gVnDayOfYear[gBlacklayerIndex] = i+1;
            gVnEarliestDayOfYear[gBlacklayerIndex] = gVnDayOfYear[gBlacklayerIndex];
            gVnLatestDayOfYear[gBlacklayerIndex] = gVnDayOfYear[gBlacklayerIndex];
			found_blacklayer_flag = true;
			found_earliest_blacklayer_flag = true;
			found_latest_blacklayer_flag = true;
			break;
			}
		}
	
	if (!found_blacklayer_flag) {
		var plot_range_index;
		startIndex = 0;
		if (currentDay < plantingDayOfYear) {
			startIndex = plantingDayOfYear - currentDay; }
		for(var i=startIndex; i<365-currentDay; i++){
			if(!found_emergence_flag && current_year_projection[i][1] >= gGDD_vn[gEmergenceIndex]){
				gVnDayOfYear[gEmergenceIndex] = currentDay+i;
				found_emergence_flag = true;
				}
			
			else if(!found_v2_flag && current_year_projection[i][1] >= gGDD_vn[gV2Index]){
				gVnDayOfYear[gV2Index] = currentDay+i;
				found_v2_flag = true;
				}
			
			else if(!found_v4_flag && current_year_projection[i][1] >= gGDD_vn[gV4Index]){
				gVnDayOfYear[gV4Index] = currentDay+i;
				found_v4_flag = true;
				}
			
			else if(!found_v6_flag && current_year_projection[i][1] >= gGDD_vn[gV6Index]){
				gVnDayOfYear[gV6Index] = currentDay+i;
				found_v6_flag = true;
				}
			
			else if(!found_v8_flag && current_year_projection[i][1] >= gGDD_vn[gV8Index]){
				gVnDayOfYear[gV8Index] = currentDay+i;
				found_v8_flag = true;
				}
			
			else if(!found_v10_flag && current_year_projection[i][1] >= gGDD_vn[gV10Index]){
				gVnDayOfYear[gV10Index] = currentDay+i;
				found_v10_flag = true;
				}
			
			else if(!found_silking_flag && current_year_projection[i][1] >= gGDD_vn[gSilkingIndex]){
				gVnDayOfYear[gSilkingIndex] = currentDay+i;
				found_silking_flag = true;
				}
			
			else if(!found_blacklayer_flag && current_year_projection[i][1] >= gGDD_vn[gBlacklayerIndex]){
				gVnDayOfYear[gBlacklayerIndex] = currentDay+i;
				found_blacklayer_flag = true;
				}
			
			if (startIndex == 0) {
					// This implies that the start date is greater than the current date.
					// Use plot_range_projection array since it represents projected accumulations since the current day.
				if(!found_earliest_emergence_flag && plot_range_projection[i][2] >= gGDD_vn[gEmergenceIndex]){
					gVnEarliestDayOfYear[gEmergenceIndex] = currentDay+i;
					found_earliest_emergence_flag = true;
					}
			
				else if(!found_earliest_v2_flag && plot_range_projection[i][2] >= gGDD_vn[gV2Index]){
					gVnEarliestDayOfYear[gV2Index] = currentDay+i;
					found_earliest_v2_flag = true;
					}
			
				else if(!found_earliest_v4_flag && plot_range_projection[i][2] >= gGDD_vn[gV4Index]){
					gVnEarliestDayOfYear[gV4Index] = currentDay+i;
					found_earliest_v4_flag = true;
					}
			
				else if(!found_earliest_v6_flag && plot_range_projection[i][2] >= gGDD_vn[gV6Index]){
					gVnEarliestDayOfYear[gV6Index] = currentDay+i;
					found_earliest_v6_flag = true;
					}
			
				else if(!found_earliest_v8_flag && plot_range_projection[i][2] >= gGDD_vn[gV8Index]){
					gVnEarliestDayOfYear[gV8Index] = currentDay+i;
					found_earliest_v8_flag = true;
					}
			
				else if(!found_earliest_v10_flag && plot_range_projection[i][2] >= gGDD_vn[gV10Index]){
					gVnEarliestDayOfYear[gV10Index] = currentDay+i;
					found_earliest_v10_flag = true;
					}
			
				else if(!found_earliest_silking_flag && plot_range_projection[i][2] >= gGDD_vn[gSilkingIndex]){
					gVnEarliestDayOfYear[gSilkingIndex] = currentDay+i;
					found_earliest_silking_flag = true;
					}
			
				else if(!found_earliest_blacklayer_flag && plot_range_projection[i][2] >= gGDD_vn[gBlacklayerIndex]){
					gVnEarliestDayOfYear[gBlacklayerIndex] = currentDay+i;
					found_earliest_blacklayer_flag = true;
					}
			
				if(!found_latest_emergence_flag && plot_range_projection[i][1] >= gGDD_vn[gEmergenceIndex]){
					gVnLatestDayOfYear[gEmergenceIndex] = currentDay+i;
					found_latest_emergence_flag = true;
					}
			
				else if(!found_latest_v2_flag && plot_range_projection[i][1] >= gGDD_vn[gV2Index]){
					gVnLatestDayOfYear[gV2Index] = currentDay+i;
					found_latest_v2_flag = true;
					}
			
				else if(!found_latest_v4_flag && plot_range_projection[i][1] >= gGDD_vn[gV4Index]){
					gVnLatestDayOfYear[gV4Index] = currentDay+i;
					found_latest_v4_flag = true;
					}
			
				else if(!found_latest_v6_flag && plot_range_projection[i][1] >= gGDD_vn[gV6Index]){
					gVnLatestDayOfYear[gV6Index] = currentDay+i;
					found_latest_v6_flag = true;
					}
			
				else if(!found_latest_v8_flag && plot_range_projection[i][1] >= gGDD_vn[gV8Index]){
					gVnLatestDayOfYear[gV8Index] = currentDay+i;
					found_latest_v8_flag = true;
					}
			
				else if(!found_latest_v10_flag && plot_range_projection[i][1] >= gGDD_vn[gV10Index]){
					gVnLatestDayOfYear[gV10Index] = currentDay+i;
					found_latest_v10_flag = true;
					}

				else if(!found_latest_silking_flag && plot_range_projection[i][1] >= gGDD_vn[gSilkingIndex]){
					gVnLatestDayOfYear[gSilkingIndex] = currentDay+i;
					found_latest_silking_flag = true;
					}

				else if(!found_latest_blacklayer_flag && plot_range_projection[i][1] >= gGDD_vn[gBlacklayerIndex]){
					gVnLatestDayOfYear[gBlacklayerIndex] = currentDay+i;
					found_latest_blacklayer_flag = true;
					break;
					}
				}	// end if (startIndex == 0)

			else {	// start_date > 0
					// This implies that start_date is after the current date.
					// Use the plot_range array since it represent accumulations since the start date
				plot_range_index = currentDay+i
				if(!found_earliest_emergence_flag && plot_range[plot_range_index][1] >= gGDD_vn[gEmergenceIndex]){
					gVnEarliestDayOfYear[gEmergenceIndex] = plot_range_index;
					found_earliest_emergence_flag = true;
					}

				else if(!found_earliest_v2_flag && plot_range[plot_range_index][1] >= gGDD_vn[gV2Index]){
					gVnEarliestDayOfYear[gV2Index] = plot_range_index;
					found_earliest_v2_flag = true;
					}

				else if(!found_earliest_v4_flag && plot_range[plot_range_index][1] >= gGDD_vn[gV4Index]){
					gVnEarliestDayOfYear[gV4Index] = plot_range_index;
					found_earliest_v4_flag = true;
					}

				else if(!found_earliest_v6_flag && plot_range[plot_range_index][1] >= gGDD_vn[gV6Index]){
					gVnEarliestDayOfYear[gV6Index] = plot_range_index;
					found_earliest_v6_flag = true;
					}

				else if(!found_earliest_v8_flag && plot_range[plot_range_index][1] >= gGDD_vn[gV8Index]){
					gVnEarliestDayOfYear[gV8Index] = plot_range_index;
					found_earliest_v8_flag = true;
					}

				else if(!found_earliest_v10_flag && plot_range[plot_range_index][1] >= gGDD_vn[gV10Index]){
					gVnEarliestDayOfYear[gV10Index] = plot_range_index;
					found_earliest_v10_flag = true;
					}

				else if(!found_earliest_silking_flag && plot_range[plot_range_index][1] >= gGDD_vn[gSilkingIndex]){
					gVnEarliestDayOfYear[gSilkingIndex] = plot_range_index;
					found_earliest_silking_flag = true;
					}

				else if(!found_earliest_blacklayer_flag && plot_range[plot_range_index][1] >= gGDD_vn[gBlacklayerIndex]){
					gVnEarliestDayOfYear[gBlacklayerIndex] = plot_range_index;
					found_earliest_blacklayer_flag = true;
					}

				if(!found_latest_emergence_flag && plot_range[plot_range_index][0] >= gGDD_vn[gEmergenceIndex]){
					gVnLatestDayOfYear[gEmergenceIndex] = plot_range_index;
					found_latest_emergence_flag = true;
					}

				else if(!found_latest_v2_flag && plot_range[plot_range_index][0] >= gGDD_vn[gV2Index]){
					gVnLatestDayOfYear[gV2Index] = plot_range_index;
					found_latest_v2_flag = true;
					}

				else if(!found_latest_v4_flag && plot_range[plot_range_index][0] >= gGDD_vn[gV4Index]){
					gVnLatestDayOfYear[gV4Index] = plot_range_index;
					found_latest_v4_flag = true;
					}

				else if(!found_latest_v6_flag && plot_range[plot_range_index][0] >= gGDD_vn[gV6Index]){
					gVnLatestDayOfYear[gV6Index] = plot_range_index;
					found_latest_v6_flag = true;
					}

				else if(!found_latest_v8_flag && plot_range[plot_range_index][0] >= gGDD_vn[gV8Index]){
					gVnLatestDayOfYear[gV8Index] = plot_range_index;
					found_latest_v8_flag = true;
					}

				else if(!found_latest_v10_flag && plot_range[plot_range_index][0] >= gGDD_vn[gV10Index]){
					gVnLatestDayOfYear[gV10Index] = plot_range_index;
					found_latest_v10_flag = true;
					}

				else if(!found_latest_silking_flag && plot_range[plot_range_index][0] >= gGDD_vn[gSilkingIndex]){
					gVnLatestDayOfYear[gSilkingIndex] = plot_range_index;
					found_latest_silking_flag = true;
					}

				else if(!found_latest_blacklayer_flag && plot_range[plot_range_index][0] >= gGDD_vn[gBlacklayerIndex]){
					gVnLatestDayOfYear[gBlacklayerIndex] = plot_range_index;
					found_latest_blacklayer_flag = true;
					break;
					}
				}	// end else start_date > current_day
			}	// end "for(var i=startIndex; i<365-currentDay; i++)"
		}	// end "if (!found_blacklayer_flag)"
		
	//console.log("gGDD_vn: "+gGDD_vn);
	//console.log("gVnDayOfYear: "+gVnDayOfYear);
	
}	// end "determine_vegetationstages_date"


function downloadFreezeData()
	{
		// Run determine_freeze for each temperature to get all freeze data for download
		// freeze_choice_index
	var temp_freeze_choice_index = freeze_choice_index;
	var spring_81_10_average_freeze_dates_download = new Array();
	var fall_81_10_average_freeze_dates_download = new Array();
	var spring_freeze_dates_download = new Array(gFreezeDataYears);
	var fall_freeze_dates_download = new Array(gFreezeDataYears);
	var spring_average_freeze_dates_download = new Array();
	var fall_average_freeze_dates_download = new Array();
	for(var i = 0; i < gFreezeDataYears; i++){
		spring_freeze_dates_download[i] = new Array();
		fall_freeze_dates_download[i] = new Array();
		}
		
		// Get freeze strings for all selectable freezes for all available years.	
	for(var i = 0; i < 11; i++){
		freeze_choice_index = i; 
		refreshSelectedIndexGraph();
		determine_freeze();
		
			// Get average last freeze string for temperature index
		//console.log("average30YearLastFreeze: ", average30YearLastFreeze);
		//console.log("string: ", getDateString(average30YearLastFreeze));
		//console.log("spring_average_freeze_dates_download: ", spring_average_freeze_dates_download);
		
		spring_81_10_average_freeze_dates_download[i] = getDateString(average1981_2010YearLastFreeze);
		spring_average_freeze_dates_download[i] = getDateString(average30YearLastFreeze);
		//if(i == 0 || i == 1){
		// console.log(last_freeze_strings);
		//}
		for(var j = 0; j < last_freeze_strings.length; j++)
			{
			//console.log(last_freeze_strings);
			if(last_freeze_strings[j].length > 0){
				for(var k = 0; k < last_freeze_strings[j].split(", ").length; k++){
					var split_value = parseInt(last_freeze_strings[j].split(", ")[k]);
					//console.log("split_value = " + split_value + "j = " + j + "date = " + getDateString(j));
					spring_freeze_dates_download[split_value-1981].push(getDateString(j+1));
					//console.log(last_freeze_strings[j].split(", ").length);
					//console.log(last_freeze_strings[j].split(", "));
					}
				}
			}
		
			// Get average first freeze string for temperature index
		//console.log("average30YearFirstFreeze: ", average30YearFirstFreeze);
		//console.log("string: ", getDateString(average30YearFirstFreeze));
		fall_81_10_average_freeze_dates_download[i] = getDateString(average1981_2010YearFirstFreeze);
		fall_average_freeze_dates_download[i] = getDateString(average30YearFirstFreeze);
		for(var j = 0; j < first_freeze_strings.length; j++)
			{
			//console.log(first_freeze_strings);
			if(first_freeze_strings[j].length > 0)
				{
				for(var k = 0; k < first_freeze_strings[j].split(", ").length; k++)
					{
					var split_value = parseInt(first_freeze_strings[j].split(", ")[k]);
					//console.log("split_value = " + split_value + "j = " + j + "date = " + getDateString(j));
					fall_freeze_dates_download[split_value-1981].push(getDateString(j+1));
					//console.log(first_freeze_strings[j].split(", ").length);
					//console.log(first_freeze_strings[j].split(", "));
					}
				}
			}
		//console.log(last_freeze_strings);
		}
	//console.log(spring_freeze_dates_download);
	
	var csvContent = "Location (lat long)," + latitude.toFixed(3) + "," + longitude.toFixed(3) + "\nLocation (county state)," + county + " Co.," + state+ "\nLast Spring Freeze,";
	for(var i = 0; i < 11; i++){
		csvContent += (25+i) + "F";
		if(i != 10){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	csvContent += "1981-2010 Average,";
	for (var j=0; j<spring_81_10_average_freeze_dates_download.length; j++){
		csvContent += spring_81_10_average_freeze_dates_download[j];
		if(j != (spring_81_10_average_freeze_dates_download.length-1)){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	csvContent += "1991-2020 Average,";
	for (var j=0; j<spring_average_freeze_dates_download.length; j++){
		csvContent += spring_average_freeze_dates_download[j];
		if(j != (spring_average_freeze_dates_download.length-1)){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	for(var i = 0; i < spring_freeze_dates_download.length; i++){
		csvContent += (1981+i) + ",";
		for(var j = 0; j < spring_freeze_dates_download[i].length; j++){
			csvContent += spring_freeze_dates_download[i][j];
			if(j != (spring_freeze_dates_download[i].length-1)){
				csvContent += ",";
				}
			}
		if(i != (spring_freeze_dates_download.length-1)){
			csvContent += "\n";
			}
		}
	
	csvContent += "\n\nFirst Fall Freeze,";
	for(var i = 0; i < 11; i++){
		csvContent += (25+i) + "F";
		if(i != 10){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	csvContent += "1981-2010 Average,";
	for (var j=0; j<fall_81_10_average_freeze_dates_download.length; j++){
		csvContent += fall_81_10_average_freeze_dates_download[j];
		if(j != (fall_81_10_average_freeze_dates_download.length-1)){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	csvContent += "1991-2020 Average,";
	for (var j=0; j<fall_average_freeze_dates_download.length; j++){
		csvContent += fall_average_freeze_dates_download[j];
		if(j != (fall_average_freeze_dates_download.length-1)){
			csvContent += ",";
			}
		else{
			csvContent += "\n";
			}
		}
		
	for(var i = 0; i < fall_freeze_dates_download.length; i++){
		csvContent += (1981+i) + ",";
		for(var j = 0; j < fall_freeze_dates_download[i].length; j++){
			csvContent += fall_freeze_dates_download[i][j];
			if(j != (fall_freeze_dates_download[i].length-1)){
				csvContent += ",";
				}
			}
		if(i != (fall_freeze_dates_download.length-1)){
			csvContent += "\n";
			}
		}
	
	//var url = 'index.php?option=com_purdue_gdd&task=getDataCSV&no_html=1'
	var url = '/groups/u2u/purdue_gdd/play/getDataCSV?no_html=1'
	var file_name = 'all_freeze_' + latitude.toFixed(3) + '_' + longitude.toFixed(3);
    // Create a form so we can submit the data to download the file
    $('body').append('\
        <form id="data_csv" style="display:none;" method="post" action="' + url + '" enctype="multipart/form-data">\
            <input name="csv" type="hidden" value="'+ csvContent +'">\
            <input name="file_name" value="' + file_name + '">\
            <input type="submit">\
        </form>'
    );
	$('#data_csv').submit().remove();
	
	freeze_choice_index = temp_freeze_choice_index;
	refreshSelectedIndexGraph();
	determine_freeze();
	//console.log(last_freeze_strings);
	//window.alert("not done yet");
	
}	// end "downloadFreezeData"


function downloadGDDData(){
	var csvContent;
	var dataDate;
	var monthNum;
	var monthDay;
	
		// Prepare average_81to10_data data for downloaD.
	for(var i = 0; i < start_date; i++){
		average_81to10_data[i] = 0; }
		
	var average_point = parseInt(orig_average_81to10_data.slice()[start_date-1]);
	for(var i = start_date; i < orig_average_81to10_data.length; i++){
		average_81to10_data[i] = parseInt(orig_average_81to10_data[i]) - average_point; }
		
	csvContent = "Location (lat long)," + latitude.toFixed(3) + "," + longitude.toFixed(3) + "\nLocation (county state)," + county + " Co.," + state + "\n";
	csvContent += "Year," + "Month," + "Day," + "Accumulated 50/86 GDDs\n";

	for(var i = 0; i < average_81to10_data.length; i++){
		dataDate = dateFromDay(1981, i+1);
		monthNum = dataDate.getMonth() + 1;
		monthDay = dataDate.getDate();
		csvContent += "1981 to 2010 Average," + monthNum + ',' + monthDay + ',' + average_81to10_data[i] + "\n";
		}
	for(var i = 0; i < average_91to20_data.length; i++){
		dataDate = dateFromDay(1991, i+1);
		monthNum = dataDate.getMonth() + 1;
		monthDay = dataDate.getDate();
		csvContent += "1991 to 2020 Average," + monthNum + ',' + monthDay + ',' + average_91to20_data[i] + "\n";
		}
	/*
	for(var i = 0; i < median_data.length; i++){
		dataDate = dateFromDay(1981, i+1);
		monthNum = dataDate.getMonth() + 1;
		monthDay = dataDate.getDate();
		csvContent += "Median," + monthNum + ',' + monthDay + ',' + median_data[i] + "\n";
		}
	*/
		//Loop through all the previous years
	all_previous_years.forEach(function(data, index){
	    for(var i = 1; i < 366; i++){
		    dataDate = dateFromDay(1981+index, i);
			monthNum = dataDate.getMonth() + 1;
			monthDay = dataDate.getDate();
		    csvContent += (1981+index) + ',' + monthNum + ',' + monthDay + ',' + data[i-1] + "\n";
	    	}
		});

		//Loop through the current year
	for(var i = 1; i <= orig_current_year_data.length; i++){
		dataDate = dateFromDay(gCurrentYear, i);
		monthNum = dataDate.getMonth() + 1;
		monthDay = dataDate.getDate();
		csvContent += gCurrentYear + ',' + monthNum + ',' + monthDay + ',' + orig_current_year_data[i-1] + "\n";
	}

	var url = '/groups/u2u/purdue_gdd/play/getDataCSV?no_html=1'
	var file_name = 'all_gdd_' + latitude.toFixed(3) + '_' + longitude.toFixed(3);
    	// Create a form so we can submit the data to download the file
    $('body').append('\
        <form id="data_csv" style="display:none;" method="post" action="' + url + '" enctype="multipart/form-data">\
            <input name="csv" type="hidden" value="'+ csvContent +'">\
            <input name="file_name" value="' + file_name + '">\
            <input type="submit">\
        </form>'
    );

    // submit & remove form
    $('#data_csv').submit().remove();
}	// end "downloadGDDData"


function findSimilarGDDYears(startIndex){
	// By Larry Biehl
	// This routine compares the current year with each of the prior years to find the the three that are
	// most similar to the current year.
	// If the number of days from the start date to the current day is less than 14 days, use the beginning
	// of the year as the start date.
	// Stop the comparison two weeks after black layer or at current date.
	// Several comparisons between sum of absolute differences and the sum of squares give the same years with
	// a few 2nd and 3rd closest being different. Using the sum of absolute differences for now.

	var useDataSincePlantingFlag = true;
	var useCurrentYear = true;
	var numberDays = current_year_data.length - startIndex;
	if (numberDays < 14) {
		startIndex = 0;
		useDataSincePlantingFlag = false;
	}

	numberDays = current_year_data.length - startIndex;
	var yearDistances = new Array(gNumberOfYears);
	var closestYearIndices = new Array(3);
	var smallestDistance;
	var difference;

	// Find the selected current year
	var drop_projection_start = document.getElementById('drop_projection_start');
	var text_projection_start = drop_projection_start.options[drop_projection_start.selectedIndex].text;

	// If text_projection_start contains previous year in text, use previous year's data
	var current_year = gCurrentYear;
	if(text_projection_start.indexOf(gPrevYear) != -1){
		current_year = gPrevYear;
		useCurrentYear = false;
	}

	var numberPriorYears = current_year - 1981;
	var comparison_end_index = Math.min(gVnDayOfYear[gBlacklayerIndex]+14,364);
	comparison_end_index = Math.min(parseInt(current_year_data.length),comparison_end_index);

	//Loop through all the previous years
	if (useDataSincePlantingFlag) {
		all_previous_years.forEach(function(data, index){
			if (index < numberPriorYears) {
				distance = 0;
				for(var i=startIndex; i<comparison_end_index; i++){
					difference = data[i] - current_year_data[i];
					//distance += difference*difference;
					distance += Math.abs(difference);
				}
				yearDistances[index] = distance;
				//yearDistances[index] = Math.abs(distance); // Needed for distance += difference, but did not do as well as others.
			}
		});
	}
	else {	// use data since start of year
		yearsArray.forEach(function(data, index){
			if (index < numberPriorYears) {
				distance = 0;
				for(var i=startIndex; i<comparison_end_index; i++){
					if ( useCurrentYear )
						difference = data[i] - orig_current_year_data[i];
					else {
						if (gHistoricalDataIncludesPreviousYearFlag)
							difference = data[i] - yearsArray[numberPriorYears][i];
						else	// !gHistoricalDataIncludesPreviousYearFlag
							difference = data[i] - orig_previous_year_data[i];
					}
					//distance += difference*difference;
					distance += Math.abs(difference);
				}
				yearDistances[index] = distance;
			}
		});
	}
	// Find the smallest three distances
	for (j=0; j<3; j++) {
		smallestDistance = Number.MAX_VALUE;
		for (i=0; i<numberPriorYears; i++) {
			if (yearDistances[i] < smallestDistance) {
				smallestDistance = yearDistances[i];
				closestYearIndices[j] = i;
			}
		}
		//console.log("closest year: "+(1981+closestYearIndices[j])+" "+Math.sqrt(yearDistances[closestYearIndices[j]]/numberDays));
		//console.log("closest year: "+(1981+closestYearIndices[j])+" "+yearDistances[closestYearIndices[j]]/numberDays);

		// Set distance for closest year to a high value so that it will not be considered
		// the next time through.
		yearDistances[closestYearIndices[j]] = Number.MAX_VALUE;
	}	// end "for (j=0; j<3; j++)"
	// Now indicate in Comparison Years drop down menu which years are similar years.
	sortCompYears(closestYearIndices,drop_comparison);
}	// end "findSimilarGDDYears"

// Move the "closest years" to the top of the selection list, preserving order in closestYearIndices
function sortCompYears(closestYearIndices,drop_comparison){
	var selectList = document.getElementById("drop_comparison");
	var selectListOptions = selectList.childNodes;

	//Clear existing highlights
	for (i=0; i<selectListOptions.length; i++ )
		selectListOptions[i].className = "";

	//Create array of options to move to front
	var similarOptions = new Array(3);
	for (i=0; i<3; i++) {
		for (j=0; j<selectListOptions.length; j++){
			if ( selectListOptions[j].value == closestYearIndices[i] ){
				similarOptions[i] = selectListOptions[j];
				similarOptions[i].className = "analog-highlight";
				break;
			}
		}
	}

	for (i=0; i<3; i++) {
		//Remove option from original position
		selectList.removeChild(similarOptions[i]);
		//Re-add option at front
		//Since we are looping through an ordered list, we insert before the number i element instead of first
		selectList.insertBefore(similarOptions[i], selectListOptions[i]);
	}
}	// end "sortCompYears"

// Calculate the probability of freeze before black layer using empirical probability method
function freezeBlacklayerCalc(){

	// Find the ealiest and latest first fall freeze dates by finding first and last non-zero values
	var earliest_freeze_index = 0;
	var lastest_freeze_index = 364;

	for(var i = 0; i < 365; i++){
		if ( all_first_freezes[i] > 0 ){
			lastest_freeze_index = i;
			if ( earliest_freeze_index == 0 )
				earliest_freeze_index = i;
		}
	}

	//Find the Earliest and latest blacklayer
	//We're not using the gVnEarliestDayOfYear[gBlacklayerIndex],etc... values since those are affected by the Variation selection
	earliest_blacklayer_index = 366;
	latest_blacklayer_index = 366;

	for(var i = 0; i < 365; i++){
		if ( full_plot_range[i][0] >= gdd_blacklayer ){
			latest_blacklayer_index = i;
			break;
		}
	}
	for(var i = 0; i < 365; i++){
		if ( full_plot_range[i][1] >= gdd_blacklayer ){
			earliest_blacklayer_index = i;
			break;
		}
	}

	var sum = 0
	//Earliest first freeze day-of-year is after the latest observed day-of-year to reach Black Layer, thus the probability 0%.
	if ( earliest_freeze_index > latest_blacklayer_index )
		sum = 0;
	//Latest observed first freeze day-of-year is before the earliest observed day-of-year to reach Black Layer, thus the probability is 100%.
	else if ( lastest_freeze_index < earliest_blacklayer_index )
		sum = 100;
	else
	{
		//Time will go from the earliest observed first freeze DOY to the earliest of [latest observed first freeze DOY and latest observed Black Layer DOY]
		var search_end = Math.min(lastest_freeze_index,latest_blacklayer_index);
		for(var i = earliest_freeze_index; i <= search_end; i++){
			var dailyProb =  0.0;
			//Prob is only non zero if atleast one first freeze occurs on this date
			if ( all_first_freezes[i] > 0 ) {
				var cBlacklayerAfter = 0;
				for ( var j = 0; j < gNumberOfYears; j++ ){
					if ( gdd_blacklayer > all_previous_years[j][i] ) {//blacklayer occurs after day
						cBlacklayerAfter++;
					}
				}
				var cFirstFreezeEqual = all_first_freezes[i];
				dailyProb = (cFirstFreezeEqual/gFreezeDataYears) * (cBlacklayerAfter/gNumberOfYears);
			}
			sum += dailyProb;
		}
		sum *= 100;
	}

	return sum;
}  //end freezeBlacklayerCalc
                
function generate_gdd_graph(lon, lat, countyName, stateName, maturityZone){
	//window.location.href = 'http://u2u-dev.rcac.purdue.edu/chart.php?lat='+lat+'&long='+lon+'&county='+countyName+'&state='+stateName;
	latitude = parseFloat(lat);
	longitude = parseFloat(lon);
	county = countyName;
	state = stateName;
	if (maturityZone == null){
		maturityZone = 95;
	}
	maturity_choice_index = 63 - (135-maturityZone);
	//alert(maturityZone);
	
	getData();
}

function getData() {
	allGDDAjax = null;
	minDataAjax = null;
	currentYearDataAjax = null;
	previousYearDataAjax = null;
	currentMinDataAjax = null;
	previousMinDataAjax = null;
	forecastDataAjax = null;
	gNewDataLoadedFlag = false;

    $('.cancel_request').hide();

    cancel_request = setTimeout(function() {
		time = 6;
		$('.cancel_request').show().html('Your selection is taking awhile, <span class="time">' + time + '</span> seconds <a id="cancel_request" onclick=cancelRequest(); href="#">cancel...</a>');
		setInterval(
			function() {
				time++;
				$('.cancel_request').find('.time').html(time);
				},
			1000
			);
		},
		5000
		);
	
    $('#circularG').show();
	$.when (
		allGDDAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getAllData?no_html=1",
			url: base_url + "/play/getAllData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				allGDD = data.split(" ");}
			}),
		minDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getMinData?no_html=1",
			url: base_url + "/play/getMinData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				orig_all_min_data = data.split(" ");}
			}),
		currentYearDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getCurrentData?no_html=1",
			url: base_url + "/play/getCurrentData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				orig_current_year_data = data.split(" ");
				if (orig_current_year_data.length > 365){
					orig_current_year_data = orig_current_year_data.slice(0,365);}
				}
			}),
		
		// "Start New Year". Get this data when starting a new year and the previous year 
		// data is not in the getAllData task.
		// "Historical Data File Change"
		// Comment out this section when the previous year data has been added to the historical
		// data file.
		/*
		previousYearDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getPrevYearData?no_html=1",
			url: base_url + "/play/getPrevYearData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				orig_previous_year_data = data.split(" ");}
			}),
		// End commented out section when the previous year data has been added to the historical data file.
		*/
		currentMinDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getMinimumCurrentData?no_html=1",
			url: base_url + "/play/getMinimumCurrentData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				minimum_current_data = data.split(" ");}
			}),
			
		// Get this data when starting a new year and the previous year data is not in the
		// getMinData task. Note that this is also needed when one has the option to display
		// gdds for sample times in the previous year. It is needed to get the last spring
		// freeze on the Data Table.
		
		previousMinDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getMinimumPreviousData?no_html=1",
			url: base_url + "/play/getMinimumPreviousData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				minimum_previous_data = data.split(" ");}
			//error: function(jqXHR, textStatus, errorThrown) {
				//console.log("MinPrevious data not read. status: "+textStatus); }
			}),
		
		forecastDataAjax = $.ajax({
			type: "GET",
			//url: "/groups/u2u/gdd/play/getForecastData?no_html=1",
			url: base_url + "/play/getForecastData?no_html=1",
			async: true,
			data: 'lat='+latitude+'&long='+longitude,
			success: function(data) {
				all_forecast_data = data.split(" ");}
			// The fail and also error callbacks do not work
			//fail: function(jqXHR, textStatus, errorThrown) {
			//	console.log("Forecast data not read. status: "+textStatus);
			//	gDefaultForecast_data_display = 0; }
			})    
		).then(dataLoadSuccess, dataLoadFailure);
        	
        //console.log("leaving getData");

}	// end "getData"

function getDateString(dayNumber, year){
	dayNumber = parseInt(dayNumber);
	var month = "";
	var day = 0;
	var savedDayNumber = 0;
	
	if (year === undefined) {
		year = 0; }
	
	if (year > 0) {
		// Check if this is a leap year
		if (isLeapYear(year)) {
			if (dayNumber > 60) {
				savedDayNumber = dayNumber;
				dayNumber -= 1; 
				}
		}
	}
	
	if(dayNumber > 334){
		month = "December";
		day = 31 - (365 - dayNumber);
	}
	else if(dayNumber > 304){
		month = "November";
		day = 30 - (334 - dayNumber);
	}
	else if(dayNumber > 273){
		month = "October";
		day = 31 - (304 - dayNumber);
	}
	else if(dayNumber > 243){
		month = "September";
		day = 30 - (273 - dayNumber);
	}
	else if(dayNumber > 212){
		month = "August";
		day = 31 - (243 - dayNumber);
	}
	else if(dayNumber > 181){
		month = "July";
		day = 31 - (212 - dayNumber);
	}
	else if(dayNumber > 151){
		month = "June";
		day = 30 - (181 - dayNumber);
	}
	else if(dayNumber > 120){
		month = "May";
		day = 31 - (151 - dayNumber);
	}
	else if(dayNumber > 90){
		month = "April";
		day = 30 - (120 - dayNumber);
	}
	else if(dayNumber > 59){
		month = "March";
		day = 31 - (90 - dayNumber);
	}
	else if(dayNumber > 31){
		month = "February";
		day = 28 - (59 - dayNumber);
		if (savedDayNumber == 60)
			day = 29;
	}
	else{
		month = "January";
		day = dayNumber;
	}
	
	return month + " " + day;
}

function getDayOfYear (year, month, day) {
		// The purpose of this routine is to return the day of year for the given year, month, and day.
		// Note that the month is 0 based in Date.
	var  day = new Date(year, month-1, day);
	var startDay = new Date(year, 0, 0);
	var dayOfYear = Math.ceil((day - startDay)/8.64e+7);
	
	return dayOfYear;
	
	}	// end "getDayOfYear"
	
function getDayOfYearFromMilliseconds (inputMilliseconds) {
	// First get the year from the input milliseconds
	var date = new Date(inputMilliseconds);
	var year = date.getFullYear();
	
	// Get the milliseconds at the start of the year
	var startOfYearMilliseconds = Date.UTC(year, 0, 1);
	
	// Now get the day of the year.
	var dayOfYear = inputMilliseconds - startOfYearMilliseconds;	
	dayOfYear /= (24 * 3600 * 1000);
	
	return dayOfYear;
	
	}	// end "getDayOfYearFromMilliseconds"

function getVegetationStageForDay(dayOfYear) {
		// Loop through the defined vegetation stages to see if any match the input day of year.	
	for (var i=gEmergenceIndex; i<=gBlacklayerIndex; i++) {
		if (dayOfYear == gVnDayOfYear[i]) {
			return gGDD_vn_label[i]; }		
		} 
		
	return "";

}	// end "getVegetationStageForDay"

function getVegetationStageForDayProjected(dayOfYear) {
	// Loop through the defined vegetation stages to see if any match the input day of year.
	var boldValue = 0;
	var first_stage_range = -1;
	var last_stage_range = -1;
	var returnStageLabel = '';
	for (var i=gEmergenceIndex; i<=gBlacklayerIndex; i++) {
		if (dayOfYear >= gVnEarliestDayOfYear[i] && dayOfYear <= gVnLatestDayOfYear[i]) {
			if (first_stage_range == -1)
				first_stage_range = i;
			else // first_stage_range != -1
				last_stage_range = i;

			if (dayOfYear == gVnDayOfYear[i])
				boldValue = 1;
			}
		else { // dayOfYear not within range
			if (first_stage_range != -1)
				break;
			}
		} 

	if (first_stage_range != -1) {
		if (last_stage_range != -1)
			boldValue = 0;

		returnStageLabel += gGDD_vn_label[first_stage_range];
		if (last_stage_range != -1)
			returnStageLabel += "-"+gGDD_vn_label[last_stage_range];

		return [returnStageLabel, boldValue];
		}	// end "if (first_stage_range == -1)"
		
	return ["", boldValue];

}	// end "getVegetationStageForDayProjected"

function getWorkingYear () {
	var drop_projection_start = document.getElementById('drop_projection_start'); 
	var text_projection_start = drop_projection_start.options[drop_projection_start.selectedIndex].text;
	
	var workingYear = gCurrentYear;
	if(text_projection_start.indexOf(gPrevYear) != -1) {
		workingYear = gPrevYear; }
		
	return workingYear;
		
	}		// end "getWorkingYear"

function getYAxisMaxes() {
    var yAxisGDDMax = 2500;
    var freezeAxisMax = 10;
    var freezeAxisInterval = 2;
    var numberOfTicks = 6;
    if (gMaxGDDValue >= 2400 && gMaxGDDValue < 2900) {
        yAxisGDDMax = 3000; 
        freezeAxisMax = 12;
        freezeAxisInterval = 2;
        numberOfTicks = 7;
        }
    else if (gMaxGDDValue >= 2900 && gMaxGDDValue < 3400) {
        yAxisGDDMax = 3500; 
        freezeAxisMax = 14;
        freezeAxisInterval = 2;
        numberOfTicks = 8;
        }
    else if (gMaxGDDValue >= 3400 && gMaxGDDValue < 3900) {
        yAxisGDDMax = 4000;
        freezeAxisMax = 16;
        freezeAxisInterval = 2;
        numberOfTicks = 9;
        }
    else if (gMaxGDDValue >= 3900 && gMaxGDDValue < 4400) {
        yAxisGDDMax = 4500;
        freezeAxisMax = 18;
        freezeAxisInterval = 2;
        numberOfTicks = 10;
        }
    else if (gMaxGDDValue >= 4400 && gMaxGDDValue < 4900) {
        yAxisGDDMax = 5000;
        freezeAxisMax = 10;
        freezeAxisInterval = 1;
        numberOfTicks = 11;
        }
    else if (gMaxGDDValue >= 4900 && gMaxGDDValue < 5400) {
        yAxisGDDMax = 5500;
        freezeAxisMax = 11;
        freezeAxisInterval = 1;
        numberOfTicks = 12;
        }
    else if (gMaxGDDValue >= 5400) {
        yAxisGDDMax = 6000;
        freezeAxisMax = 12;
        freezeAxisInterval = 1;
        numberOfTicks = 13;
        }
        
    return [yAxisGDDMax, freezeAxisMax, freezeAxisInterval, numberOfTicks];

}   // end "getYAxisMaxes"

function init(){  
		// Hide the graph and data tabs to start with.
	jQuery('#graph_tab').hide();
	jQuery('#data_tab').hide();
	
	if (mapping.mobileUser){
		$("#location-tip").hide();
		$("#zoom-tip").text('Use pinch zoom and pan to navigate around the chart and magnify details. Once zoomed in, a "Reset zoom" button will appear in the upper right area of the graph.');
		$("#graph_element").attr('data-intro-disabled','Use pinch zoom and pan to navigate around the chart and magnify details. Once zoomed in, a "Reset zoom" button will appear in the upper right area of the graph.');
	}

	
	
		// Initialize gdds for early vegetation phases.
	gGDD_vn[gEmergenceIndex] = 105;
	gGDD_vn[gV2Index] = gGDD_vn[gEmergenceIndex]  + 2*84;
	gGDD_vn[gV4Index] = gGDD_vn[gV2Index]+ 2*84;
	gGDD_vn[gV6Index] = gGDD_vn[gV4Index] + 2*84;
	gGDD_vn[gV8Index] = gGDD_vn[gV6Index] + 2*84;
	gGDD_vn[gV10Index] = gGDD_vn[gV8Index] + 2*84;
	gGDD_vn[gSilkingIndex] = -1;
	gGDD_vn[gBlacklayerIndex] = -1;
	
		// Initialize gdds for early vegetation phases.
	gGDD_vn_label[gEmergenceIndex] = "Emergence";
	gGDD_vn_label[gV2Index] = "V2";
	gGDD_vn_label[gV4Index] = "V4";
	gGDD_vn_label[gV6Index] = "V6";
	gGDD_vn_label[gV8Index] = "V8";
	gGDD_vn_label[gV10Index] = "V10";
	gGDD_vn_label[gSilkingIndex] = "Silking";
	gGDD_vn_label[gBlacklayerIndex] = "Blacklayer";

} 		// end "init"

function isLeapYear(year) {
	return new Date(year, 1, 29).getMonth() == 1;
}

function listCurrentYearVegetationStageInfo (vegStageIndex, labelElementName, elementName) {
            
	if (gVnEarliestDayOfYear[vegStageIndex] == gVnLatestDayOfYear[vegStageIndex]) {
		document.getElementById(labelElementName).innerHTML = gGDD_vn_label[vegStageIndex]+" Date";
        var label = (gVnDayOfYear[vegStageIndex] == 366) ? "None" : getDateString(gVnDayOfYear[vegStageIndex]);
		document.getElementById(elementName).innerHTML = label; 
		}
		
	else {
		document.getElementById(labelElementName).innerHTML = gGDD_vn_label[vegStageIndex]+" Date (Estimated (Earliest-Latest))";
		var earliest_label = (gVnEarliestDayOfYear[vegStageIndex] == 366) ? "None" : getDateString(gVnEarliestDayOfYear[vegStageIndex]);
		var average_label = (gVnDayOfYear[vegStageIndex] == 366) ? "None" : getDateString(gVnDayOfYear[vegStageIndex]);
		var latest_label = (gVnLatestDayOfYear[vegStageIndex] == 366) ? "None" : getDateString(gVnLatestDayOfYear[vegStageIndex]);
		document.getElementById(elementName).innerHTML = average_label + " (" + earliest_label + " - " + latest_label + ")";
		}

}	// end "listCurrentYearVegetationStageInfo"


function listThirtyYearHistoryInfoForVegetationStage (vegStageIndex, averageHistoryElement, rangeHistoryElement) {
		
		// Get the information for the 1991-2020 history	
	var allVegStageDates = new Array();
	var foundVegStageFlag = false;
	////for(var i=0; i<all_previous_years.length-3; i++){
	for(var i=gHistoryIndexStart; i<gHistoryIndexEnd; i++){
		var vegStageDateNumber;
		var foundVegStageFlag = false;
		for(vegStageDateNumber=0; vegStageDateNumber<all_previous_years[i].length; vegStageDateNumber++){
			if(gGDD_vn[vegStageIndex] < all_previous_years[i][vegStageDateNumber]){
				allVegStageDates.push(vegStageDateNumber+1);
				foundVegStageFlag = true;
				break;
				}
			}
		if(!foundVegStageFlag){
			allVegStageDates.push(1000); }
		}
	//console.log("allVegStageDates: "+allVegStageDates);
	vegStageDateAverage = 0;
	var noVegStageCount = 0;
	for(var i=0; i<allVegStageDates.length; i++){
		if(allVegStageDates[i] == 1000){
			noVegStageCount++; }
		else{
			vegStageDateAverage += allVegStageDates[i];	}
		}
	if(noVegStageCount >= Math.ceil(allVegStageDates.length/2)){
		document.getElementById(averageHistoryElement).innerHTML = 'None'; }
	else{
		vegStageDateAverage /= (allVegStageDates.length - noVegStageCount);
		document.getElementById(averageHistoryElement).innerHTML = getDateString(vegStageDateAverage);
		}
		
	allVegStageDates.sort(function(a,b){return a-b;});
	if(document.getElementById('drop_percentileData').selectedIndex == 0){
		if(allVegStageDates[0] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML = 'None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML = '' + getDateString(allVegStageDates[0]); }
			
		if(allVegStageDates[allVegStageDates.length-1] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML += ' - None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML += ' - ' + getDateString(allVegStageDates[allVegStageDates.length-1]);	}
		}
		
	else if(document.getElementById('drop_percentileData').selectedIndex == 1){
		if(allVegStageDates[4] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML = 'None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML = '' + getDateString(allVegStageDates[4]); }
			
		if(allVegStageDates[allVegStageDates.length-6] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML += ' - None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML += ' - ' + getDateString(allVegStageDates[allVegStageDates.length-6]);	}
		}
	else if(document.getElementById('drop_percentileData').selectedIndex == 2){
		if(allVegStageDates[9] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML = 'None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML = '' + getDateString(allVegStageDates[9]); }
			
		if(allVegStageDates[allVegStageDates.length-11] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML += ' - None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML += ' - ' + getDateString(allVegStageDates[allVegStageDates.length-11]); }
		}
	else if(document.getElementById('drop_percentileData').selectedIndex == 3){
		if(allVegStageDates[14] == 1000){
			document.getElementById(rangeHistoryElement).innerHTML = 'None'; }
		else{
			document.getElementById(rangeHistoryElement).innerHTML = '' + getDateString(allVegStageDates[14]); }
		}

}	// end "listThirtyYearHistoryInfoForVegetationStage"

function loadData(){
	//console.log("Enter loadData");
	//var date = new Date();
	//console.log("start read data: "+date);
	//minimum_current_data = getMinimumCurrentData().split(" ");
	//minimum_previous_data = getMinimumPreviousData().split(" ");
	//allGDD = getallgdddata().split(" ");
	//orig_current_year_data = getCurrentData().split(" ");//[<?php echo $currentYear?>];
	orig_average_81to10_data = allGDD.slice(0,365);
	//orig_median_data = allGDD.slice(365, 730); // Currently not used in the GDD tool.
	
	current_year_data = orig_current_year_data.slice();
	average_81to10_data = orig_average_81to10_data.slice();

	/*maturity_choice_index = 23;
	freeze_choice_index = 3;
	freeze_choice_value = 28;
	percentile_choice_index = 0;
	month_choice_index = 3;*/

	//orig_all_min_data = getmindata().split(" ");//[<?php echo $all_min_data?>];
	all_min_data = orig_all_min_data.slice();
	//console.log("all_min_data: "+all_min_data);
	
	//var date = new Date();
	//console.log("end read data: "+date);

	orig_all_years_data = allGDD.slice(730, allGDD.length+1);
	yearsArray = new Array(gNumberOfYears);
	for(var i = 0; i < gNumberOfYears; i++){
		yearsArray[i] = allGDD.slice(730+(365*i), 1095+(365*i)); 
	}

  selected_comparisons = [];
	//if previous data isn't archived, use the data retrieved
	if (yearsArray[yearsArray.length-1].length == 0)
		yearsArray[yearsArray.length-1] = orig_previous_year_data;

	previous_year_data[0] = new Array();
	previous_year_data[1] = new Array();
	previous_year_data[2] = new Array();
	
	// Get the 1991-2020 30 year average 
	// A range of 0 to 30 will give a the 1981 to 2010 30-year average
   for(var i = 0; i < 365; i++){
		total_30_year_gdds = 0
		for(var j = gHistoryIndexStart; j < gHistoryIndexEnd; j++){
			total_30_year_gdds += parseInt(yearsArray[j][i]);
         } 
      orig_average_91to20_data[i] = Math.round(total_30_year_gdds/30);
      //console.log(i+1, orig_average_91to20_data[i]);
         
      }
   //console.log("orig_average_91to20_data is loaded: ", +orig_average_91to20_data[100]);

	orig_forecast_models = new Array(gNumberOfModels);
	var forecast_model_length = parseInt(all_forecast_data.length/gNumberOfModels);
	if (forecast_model_length == 0)
		gDefaultForecast_data_display = 0;
	for(var i = 0; i < gNumberOfModels; i++){
		orig_forecast_models[i] = all_forecast_data.slice((forecast_model_length*i), forecast_model_length+(forecast_model_length*i));
	}
	
	////current_year_projection = new Array(average_81to10_data.length - orig_current_year_data.length);
	current_year_projection = new Array(orig_average_91to20_data.length - orig_current_year_data.length);

	day_for_date = 1;
	day_for_maturity = 95;

	gdd_silk = 0;
	gdd_blacklayer = 0;
	silk = new Array(365);
	blacklayer = new Array(365);
	for(var i = 0; i < 365; i++){
		silk[i] = 0;
		blacklayer[i] = 0;
	}

	last_freeze = new Array(365);
	first_freeze = new Array(365);
	all_last_freezes = new Array(365);
	all_first_freezes = new Array(365);
	last_freeze_count = new Array(365);
	first_freeze_count = new Array(365);
	last_freeze_strings = new Array(365);
	first_freeze_strings = new Array(365);
	for(var i = 0; i < 365; i++){
		last_freeze[i] = 0;
		first_freeze[i] = 0;
		all_last_freezes[i] = 0;
		all_first_freezes[i] = 0;
		last_freeze_count[i] = 0;
		first_freeze_count[i] = 0;
		last_freeze_strings[i] = "";
		first_freeze_strings[i] = "";
	}

	// Boolean for remembering legend selection
	show_silking = true;
	show_silking_horizontal = true;
	show_blacklayer = true;
	show_blacklayer_horizontal = true;
	show_average_last_freeze = true;
	show_all_last_freezes = true;
	show_average_first_freeze = true;
	show_all_first_freezes = true;
	show_average = true;
	show_median = false;
	show_comparison_year = true;
	show_current_projection = true;
	show_current_forecast = true;
	show_current_year = true;
	show_full_range = true;
	show_projected_range = true;
	show_forecast_range = true;

	no_variation = false;

	plot_range = new Array(365);
	plot_range_projection = new Array(365);
	orig_low_range = new Array(365);
	orig_high_range = new Array(365);
	orig_low_range_projection = new Array(365);
	orig_high_range_projection = new Array(365);
	low_range = new Array(365);
	high_range = new Array(365);
	//full_range = new Array(365);
	//plantDate is a 3 or 4 digit number in mmdd format. Leading zero on month may be omitted
	plantMonth =  Math.floor(plantDate/100);
	plantDay = plantDate % 100;
	//We can't assign drop_day yet since the options haven't been populated yet
	document.getElementById("drop_months").value = plantMonth;
	month_choice_index = document.getElementById('drop_months').selectedIndex;
	document.getElementById("drop_days").innerHTML = "";

	populate_list();
	
	if (/iP(od|ad|hone)/i.test(window.navigator.userAgent) ||
	( /Android/i.test(window.navigator.userAgent) && /Mobile/i.test(window.navigator.userAgent) ) ) {
		$('#drop_comparison').change(function(event) {
		    if ($(this).val() && $(this).val().length > 3) {
		        $(this).blur();
		    }
		});
	}
	else{
		$("#drop_comparison").select2({
			maximumSelectionSize: 3,
			width: '160px',
		});
		gl_using_select2 = true;
	}
		// Force silking and black layer maturity values to be set.
	setMaturityValuesFromGraph();
	//var date = new Date();
	//console.log("ready to call regraph: "+date);
	regraph();
	//var date = new Date();
	//console.log("ready to call determine freeze: "+date);
	determine_freeze();
	//var date = new Date();
	//console.log("after call to determine freeze: "+date); 
	//determine_silk_blacklayer(); 
	//determine_range();
}	// end "loadData"



/**
*  plot_comparison
*  When a new comparison year is selected from the dropdown menu, grab the data from the array containing all years data and remake the graph
**/
function plot_comparison(){
	regraph();
}

function onIntroJSExit() {
	//console.log("In intrJS exit routine");
	gSingleIntroJSCallFlag = false;
}


/***
*  populate_list()
*
*  This function will populate the dropdown menus that aren't specifically outlined in display.php
*  This includes the list of days for the gdd start date, comparison years list, etc.
***/
function populate_list(){
		// set percentile choice
	var drop_percentile = document.getElementById('drop_percentile');
	drop_percentile.options[percentile_choice_index].selected = true;
	
	var drop_percentileData = document.getElementById('drop_percentileData');
	drop_percentileData.options[percentile_choice_index].selected = true;
	
		// populate comparison years
	var drop_comparison = document.getElementById('drop_comparison');

		// Make sure to empty the lists before adding new things
	$("#drop_comparison").empty();
		// Add all comparison year dates
	for(var i = gNumberOfYears-1; i >= 0; i--){
		drop_comparison.options.add(new Option(i+1981, i));
	}
	
	//Empty selections in select2 UI
	if ( gl_using_select2 )
		$("#drop_comparison").select2('data',[]);

	if( selected_comparisons && selected_comparisons.length > 0 ){
		selected_comparisons_array = [];
		selected_comparisons.forEach(function(data) {
			yearText = $("#drop_comparison option[value='"+data+"']").text();
			selected_comparisons_array.push({id: data, text: yearText});
		});
		if ( gl_using_select2 ){
			$("#drop_comparison").select2('data',selected_comparisons_array);
		}
		else
			$("#drop_comparison").val(selected_comparisons);
	}

		// populate freeze
	var drop_freeze = document.getElementById('drop_freeze');
	var drop_freezeData = document.getElementById('drop_freezeData');
	$("#drop_freeze").empty();
	$("#drop_freezeData").empty();
	for(var i = 0; i < 11; i++){
		drop_freeze.options.add(new Option(i+25, i));
		drop_freezeData.options.add(new Option(i+25, i));
		}
	drop_freeze.options[freeze_choice_index].selected = true;
	drop_freezeData.options[freeze_choice_index].selected = true;
	
		// populate maturity
	var drop_maturity = document.getElementById('drop_maturity');
	var drop_maturityData = document.getElementById('drop_maturityData');
	$("#drop_maturity").empty();
	$("#drop_maturityData").empty();
	
	max_corn_maturity_days_index = 64;
	for(var i = 0; i < max_corn_maturity_days_index; i++){
		drop_maturity.options.add(new Option(i+72, i));
		drop_maturityData.options.add(new Option(i+72, i));
		}
		//Add the 'Custom->' option at the end
	drop_maturity.options.add(new Option("Custom->", max_corn_maturity_days_index));
	drop_maturityData.options.add(new Option("Custom->", max_corn_maturity_days_index));

	drop_maturity.options[maturity_choice_index].selected = true;
	drop_maturityData.options[maturity_choice_index].selected = true;
	
		// populate days of the months
	var drop_mon = document.getElementById('drop_months');
	var drop_days = document.getElementById('drop_days');
	var drop_monData = document.getElementById('drop_monthsData');
	var drop_daysData = document.getElementById('drop_daysData');
	var val_days = 0;
	
	// Try to get a value for day selection so if someone chooses a date, it will be remembered and reset
	try{
		val_days = drop_days.options[drop_days.selectedIndex].value; 
		}
	catch(err){}
	
		// Empty all day values
	$("#drop_days").empty();
	$("#drop_daysData").empty();
	
	var val = drop_mon.options[drop_mon.selectedIndex].index;

	var num_days = 0;
	// Set the day count to 31, 30 or 28 days depending on the month selected
	if(val == 0 || val == 2 || val == 4 || val == 6 || val == 7 || val == 9 || val == 11){
		num_days = 31; }
	else if(val == 1){
		num_days = 28; }
	else{
		num_days = 30; }
	
	// Add the correct number of days to the dropdown list
	for(var i = 1; i <= num_days; i++){
		drop_days.options.add(new Option(i, i-1));
		drop_daysData.options.add(new Option(i, i-1));
		}
	
	// If we got a value above for day selection, re-select that day. If not, select the 1st as the default day.
	if(val_days){
		try{
			drop_days.options[val_days].selected = true;
			drop_daysData.options[val_days].selected = true; }
		catch(err){
			drop_days.options[0].selected = true;
			drop_daysData.options[0].selected = true; }
		}
		else{
			day_choice_index = plantDay - 1; // day option values are zero based
			drop_days.value = day_choice_index;
	  }
	  
	// Set current day option
	drop_projection_start.options[current_day_index].selected = true;
	drop_projection_startData.options[current_day_index].selected = true;
}

// Get date for credits on graph
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1;

var yyyy = today.getFullYear();
if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm} today = mm+'/'+dd+'/'+yyyy;
// end get date for credits

// Make sure the proper dropdown indices are selected for the graph tab
function refreshSelectedIndexGraph(){
	document.getElementById('drop_months').options[month_choice_index].selected = true;
	document.getElementById('drop_days').options[day_choice_index].selected = true;
	document.getElementById('drop_maturity').options[maturity_choice_index].selected = true;
	document.getElementById('drop_freeze').options[freeze_choice_index].selected = true;
	document.getElementById('drop_percentile').options[percentile_choice_index].selected = true;
	document.getElementById('drop_projection_start').options[current_day_index].selected = true;

	document.getElementById('silking_gdds').value = gdd_silk;
	document.getElementById('blacklayer_gdds').value = gdd_blacklayer;
}

// Make sure the proper dropdown indices are selected for the data tab
function refreshSelectedIndexData(){
	document.getElementById('drop_monthsData').options[month_choice_index].selected = true;
	document.getElementById('drop_daysData').options[day_choice_index].selected = true;
	document.getElementById('drop_maturityData').options[maturity_choice_index].selected = true;
	document.getElementById('drop_freezeData').options[freeze_choice_index].selected = true;
	document.getElementById('drop_percentileData').options[percentile_choice_index].selected = true;
	document.getElementById('drop_projection_startData').options[current_day_index].selected = true;

	document.getElementById('silking_gddsData').value = gdd_silk;
	document.getElementById('blacklayer_gddsData').value = gdd_blacklayer;
}

/***
* regraph()
* 
* This function calculates the current year, projection year, and range data for both depending on "current day" and gdd start date
* This is a terrible name for the function and should probably be changed at some point.
*
***/
function regraph() {
	//  Set up variable to determine how many forecasted days to display
	forecast_data_display = gDefaultForecast_data_display;
	//var date = new Date();
	//console.log("start regraph: ");
	// Figure out "Current Day" - If current year is previous year, change current_year_data to correct array
	var drop_projection_start = document.getElementById('drop_projection_start'); 
	var value_projection_start = drop_projection_start.options[drop_projection_start.selectedIndex].value;
	var text_projection_start = drop_projection_start.options[drop_projection_start.selectedIndex].text;
	
	var workingYear = gCurrentYear;
	if(text_projection_start.indexOf(gPrevYear) != -1) {
		workingYear = gPrevYear; }
	
	full_plot_range = new Array();
	for (var i = 0; i < 365; i++)
		full_plot_range[i] = [0,0];

		// If text_projection_start contains previous year in text, use previous year's data
	if(text_projection_start.indexOf(gPrevYear) != -1){
		current_year_data = yearsArray[gNumberOfYears-1].slice(); }
		// Otherwise, use current year's data
	else{
		current_year_data = orig_current_year_data.slice();	}
	
	// Convert string to integer for calculations
	for(var i = 0; i < current_year_data.length; i++){
		current_year_data[i] = parseInt(current_year_data[i]); }
	
	// Get the correct data for comparison year line (from dropdown selection)
		// Note that these arrays get redone later. Will not set up here
	//average_data = orig_average_data.slice();

	//  Get month and day selection
	var drop_mon = document.getElementById('drop_months');
	var drop_days = document.getElementById('drop_days');
	var value_month = drop_mon.options[drop_mon.selectedIndex].value;
	var value_day = drop_days.options[drop_days.selectedIndex].text;
	
	// This variable is used in the graph title
	day_for_date = value_day;
	
	// Get the start day number depending on the month and day selected
	start_date = 0;
	if(value_month == 1){
		start_date = parseInt(value_day); }
	else if(value_month == 2){
		start_date = parseInt(value_day) + 31; }
	else if(value_month == 3){
		start_date = parseInt(value_day) + 59; }
	else if(value_month == 4){
		start_date = parseInt(value_day) + 90; }
	else if(value_month == 5){
		start_date = parseInt(value_day) + 120;	}
	else if(value_month == 6){
		start_date = parseInt(value_day) + 151;	}
	else if(value_month == 7){
		start_date = parseInt(value_day) + 181;	}
	else if(value_month == 8){
		start_date = parseInt(value_day) + 212;	}
	else if(value_month == 9){
		start_date = parseInt(value_day) + 243;	}
	else if(value_month == 10){
		start_date = parseInt(value_day) + 273;	}
	else if(value_month == 11){
		start_date = parseInt(value_day) + 304;	}
	else if(value_month == 12){
		start_date = parseInt(value_day) + 334;	}
	else{
		return;	}

		// Get the current start date GDD value from the original source (either previous or this year's data)
	var current_point;
	if(text_projection_start.indexOf(gPrevYear) != -1){
		current_point = parseInt(yearsArray.slice()[gNumberOfYears-1][start_date-1]);	}
	else{
		current_point = parseInt(orig_current_year_data.slice()[start_date-1]);	}
	
		// Get gdd value for the comparison year, average and median lines
	var previous_point = new Array(3);

	for(var i = 0; i < selected_comparisons.length; i++ )
		previous_point[i] = parseInt(yearsArray.slice()[selected_comparisons[i]][start_date-1]);

	////var average_point = parseInt(orig_average_81to10_data.slice()[start_date-1]);
	var average_point = parseInt(orig_average_91to20_data.slice()[start_date-1]);
	
		// set up start points for every year
	var all_previous_points = new Array();
	all_previous_years = new Array(gNumberOfYears);
	for(var i = 0; i < yearsArray.length; i++){
		all_previous_years[i] = yearsArray[i].slice(); }
		
	for(var i = 0; i < all_previous_years.length; i++){
		all_previous_points.push(parseInt(all_previous_years.slice()[i][start_date-1])); }

	var all_model_points = new Array();
	forecast_models = new Array(gNumberOfModels);
	for(var i = 0; i < gNumberOfModels; i++){
		forecast_models[i] = orig_forecast_models[i].slice();
	}
	for(var i = 0; i < gNumberOfModels; i++){
		all_model_points.push(parseInt(forecast_models[i][start_date-1]));
	}

		//  Set all points in the data to 0 until the start date
	for(var i = 0; i < start_date; i++){
		if ( i < current_year_data.length )
			current_year_data[i] = 0;
		for(var j = 0; j < selected_comparisons.length; j++)
			previous_year_data[j][i] = 0;
		////average_81to10_data[i] = 0;
		average_91to20_data[i] = 0;
		//median_data[i] = 0;
		for(var j = 0; j < all_previous_years.length; j++){
			all_previous_years[j][i] = 0; }
		for(var j = 0; j < gNumberOfModels; j++){
			forecast_models[j][i] = 0;
		}
		}
	
		// Make calculations for the "current day" selection
	var temp_current_year_data = new Array();
		// ***** CHECK THE DISPLAY.PHP FOR CORRECT VALUES TO MATCH DROPDOWN CHOICES *********
        // March 1
	if(value_projection_start == 1){
		for(var i = 0; i < 59; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
		current_day = 60;
        }
        // April 1
	else if(value_projection_start == 2){
		for(var i = 0; i < 90; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
		current_day = 91;
        }
        // May 1
	else if(value_projection_start == 3){
		for(var i = 0; i < 120; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
		current_day = 121;
        }
        // June 1
	else if(value_projection_start == 4){
		for(var i = 0; i < 151; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
		current_day = 152;
        }
        // July 1
	else if(value_projection_start == 5){
		for(var i = 0; i < 181; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
		current_day = 182;
        }
        // August 1
	else if(value_projection_start == 6){
		for(var i = 0; i < 212; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
            current_day = 213;
	}
		// September 1
	else if(value_projection_start == 7){
		for(var i = 0; i < 243; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
            current_day = 244;
	}
		// December 31
	else if(value_projection_start == 8){
		for(var i = 0; i < 364; i++){
			if((current_year_data[i] - current_point) < 0){
				temp_current_year_data.push(0); }
			else{
				temp_current_year_data.push(current_year_data[i] - current_point); }
            }
            current_day = 365;
	}
	else{
		current_day = -1; }

	// Don't display forecast if previous year is selected
	if ( current_day > 0 )
		forecast_data_display = 0;
	
		// If temp array has values, we'll use that as the new current year data
		// "Current Day" selected will be shown by this current_year_data array when plotted on the graph
	if(temp_current_year_data.length > 0){
		current_year_data = temp_current_year_data.slice();	}
	else{
			// If temp array isn't > 0, then that means we're using today's date
			// The initial values will already be 0 up to the start date
			// Use the difference of the current year data and the start date gdd value as the new point from then on
		for(var i = start_date; i < orig_current_year_data.length; i++){
			current_year_data[i] = parseInt(orig_current_year_data[i]) - current_point;
			full_plot_range[i] = [current_year_data[i],current_year_data[i]]
		}
	}

	// GDD value current day
	var startValue = current_year_data[current_year_data.length-1];

	// Make sure the projection range start is not before the gdd start date.
	var projectionRangeStart = Math.max(current_year_data.length, start_date);

		// Same logic for the comparison year, average, median and all previous years lines
	for ( var j = 0; j < selected_comparisons.length; j++ ) {
		for(var i = start_date; i < yearsArray[selected_comparisons[j]].length; i++){
			previous_year_data[j][i] = parseInt(yearsArray[selected_comparisons[j]][i]) - previous_point[j];
		}
	}
		// Keep average_81to10_data calculation in for now in case needed for data download
	//for(var i = start_date; i < orig_average_81to10_data.length; i++){
	//	average_81to10_data[i] = parseInt(orig_average_81to10_data[i]) - average_point; }
	for(var i = start_date; i < orig_average_91to20_data.length; i++){
		average_91to20_data[i] = parseInt(orig_average_91to20_data[i]) - average_point; }
	for(var i = 0; i < all_previous_years.length; i++){
		for(var j = start_date; j < all_previous_years[i].length; j++){
			all_previous_years[i][j] = parseInt(yearsArray[i][j]) - all_previous_points[i];	}
		}

	var forecast_model_length = forecast_models[0].length;
	var tempYears = new Array(gNumberOfModels);
	for(var i = 0; i < gNumberOfModels; i++){
		tempYears[i] = new Array(forecast_model_length);
		for(var j = 0; j < projectionRangeStart; j++){
			tempYears[i][j] = 0;
		}
	}

	// Adjust all forecast models, subtract off values at start_date (previously stored)
	for(var i = 0; i < gNumberOfModels; i++){
		for(var j = start_date; j < forecast_model_length; j++){
			forecast_models[i][j] = parseInt(forecast_models[i][j]) - all_model_points[i];
		}
	}

	// Adjust the forecast models to start at current gdd ( will be greater than zero if current date after planting date)
	for(var i = 0; i < gNumberOfModels; i++){
		for(var j = projectionRangeStart; j < forecast_model_length; j++){
			tempYears[i][j] = forecast_models[i][j] - forecast_models[i][projectionRangeStart-1] + startValue;
		}
	}

	// (Deep) Copy adjusted value back to forecast_models array
	for(var i = 0; i < gNumberOfModels; i++){
		forecast_models[i] = tempYears[i].slice();
	}
	tempYears.length = 0;

	forecast_mean = new Array(forecast_model_length);
	// Calculate the mean of all forecast models
	for(var i = 0; i < forecast_model_length; i++){
		var daily_mean = 0;
		for(var j = 0; j < gNumberOfModels; j++){
			daily_mean += forecast_models[j][i];
		}
		forecast_mean[i] = parseInt(daily_mean/gNumberOfModels);
	}

	// Set up forecast line for current year, we want the line to start where the current year line ends
	// forecast_data_display controls how many days of forecasted data is used (max is 90)

	// Limit forecast display by data available
	var forecast_days_avail = Math.max(forecast_mean.length - current_year_data.length,0);
	
  forecast_data_display = Math.min(forecast_data_display, forecast_days_avail);
  var end_forecast = current_year_data.length + forecast_data_display;
  
	// Set up the projection line for the current year if we haven't reached the end of the year yet
	// Since we want the line to start where the current year line ends, we need to use a 2 dimensional array for highcharts
	// First value is going to be the time in milliseconds to the desired date from Jan. 1.
	// Second value is the GDD value for the date
	////current_year_projection = new Array(average_81to10_data.length - current_year_data.length);
	current_year_projection = new Array(average_91to20_data.length - current_year_data.length);
	current_year_forecast_projection = new Array();
	current_year_hist_projection = new Array();
	
	// Get start time to use for x-axis. Need to convert from day of year for the current year to Highcharts time stamp.
	var time = Date.UTC(workingYear, 0, 1);
	var dayIncrement = 24 * 3600 * 1000;
	time += current_year_data.length * dayIncrement;
	
	// Projection line starts where current year data ends
	////for(var i = current_year_data.length; i < average_81to10_data.length; i++){
	for(var i = current_year_data.length; i < average_91to20_data.length; i++){
		// Days where we have or are using forecast data, default is upto 90 days
		if ( i-current_year_data.length < forecast_data_display ){
			//current_year_forecast_projection[i-current_year_data.length] = [(i*24*3600*1000), forecast_mean[i] ];
			current_year_forecast_projection[i-current_year_data.length] = [(time), forecast_mean[i] ];
			current_year_projection[i-current_year_data.length] = current_year_forecast_projection[i-current_year_data.length];
		}
		// Using Historical Projection - Case where no forecast is present
		else if(current_year_data[i-1]){
			//current_year_hist_projection[i-end_forecast] = [(i*24*3600*1000),(average_data[i] - average_data[i-1]) + current_year_data[i-1]];
			////current_year_hist_projection[i-end_forecast] = [(time),(average_81to10_data[i] - average_81to10_data[i-1]) + current_year_data[i-1]];
			current_year_hist_projection[i-end_forecast] = [(time),(average_91to20_data[i] - average_91to20_data[i-1]) + current_year_data[i-1]];
			current_year_projection[i-current_year_data.length] = current_year_hist_projection[i-end_forecast];
		}
		// Fringe case for historical projection
		else if((i - current_year_data.length - 1) < 0){
			//current_year_hist_projection[i-end_forecast] = [(i*24*3600*1000),(average_data[i] - average_data[i-1])];
			////current_year_hist_projection[i-end_forecast] = [(time),(average_81to10_data[i] - average_81to10_data[i-1])];
			current_year_hist_projection[i-end_forecast] = [(time),(average_91to20_data[i] - average_91to20_data[i-1])];
			current_year_projection[i-current_year_data.length] = current_year_hist_projection[i-end_forecast];
		}
		// Main case for historical projection, build on current projection
		else{
			//current_year_hist_projection[i-end_forecast] = [(i*24*3600*1000),(average_data[i] - average_data[i-1]) + current_year_projection[i-current_year_data.length-1][1]];
			////current_year_hist_projection[i-end_forecast] = [(time),(average_81to10_data[i] - average_81to10_data[i-1]) + current_year_projection[i-current_year_data.length-1][1]];
			current_year_hist_projection[i-end_forecast] = [(time),(average_91to20_data[i] - average_91to20_data[i-1]) + current_year_projection[i-current_year_data.length-1][1]];
			current_year_projection[i-current_year_data.length] =	current_year_hist_projection[i-end_forecast];
		}
	time += dayIncrement;
	}
	
	var orig_current_year_projection = current_year_projection.slice();
	
		// Calculate range
		// Get percent variation from dropdown
	var drop_percentile = document.getElementById('drop_percentile');
	var percentile_value = drop_percentile.options[drop_percentile.selectedIndex].value;
	var tempYears = new Array(gNumberOfYears-1);
	var full_range = new Array(365);
	
		// Set up temporary array for all years, initializing to 0
	for(var i = 0; i < gNumberOfYears - 1; i++){
		tempYears[i] = new Array(365);
		for(var j = 0; j < start_date; j++){
			tempYears[i][j] = 0; }
		}
		
		// For each year, get the difference of current gdd value and gdd value at the start/planting date
	for(var i = 0; i < gNumberOfYears - 1; i++){
		for(var j = start_date; j < yearsArray[i].length; j++){
			tempYears[i][j] = parseInt(yearsArray[i][j] - yearsArray[i][start_date-1]);	}
		}
	
	// Combine the temp years array into one array that contains the full range of data for each day of the year
	// Years 10 to 40 will represent 1991 to 2020 30 year range
   for(var i = 0; i < 365; i++){
		full_range[i] = new Array();
		for(var j = gHistoryIndexStart; j < gHistoryIndexEnd; j++){
			full_range[i].push(tempYears[j][i]);
            }          
        }
	
        // Get the maximum gdd value. Will be used to determine max value for the graph.
    var sortedArray = [];
    sortedArray = full_range[364].sort(function(a,b){return a - b});
    gMaxGDDValue = sortedArray[sortedArray.length-1];
	
        // If no variation is warranted, set high and low range to be nothing.  We don't need to display any range.
	if(percentile_value == 3){
		for(var i = 0; i < 365; i++){
			orig_low_range[i] = 0;
			orig_high_range[i] = 0;
			}
		}
        // Sort the full range for each day, get the values for the middle 10 years.  Set those to high and low range values
	else if(percentile_value == 2){
		for(var i = 0; i < 365; i++){
			//orig_low_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0+10]);
			//orig_high_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1-10]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range[i] = parseInt(sortedArray[0+10]);
			orig_high_range[i] = parseInt(sortedArray[full_range[i].length-1-10]);
			}
		}
        // Sort the full range for each day, get the values for the middle 20 years.  Set those to high and low range values
	else if(percentile_value == 1){
		for(var i = 0; i < 365; i++){
			//orig_low_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0+5]);
			//orig_high_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1-5]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range[i] = parseInt(sortedArray[0+5]);
			orig_high_range[i] = parseInt(sortedArray[full_range[i].length-1-5]);
			}
		}
        // Sort the full range for each day.  Set the high and low values to be the first and last values of the full range array.
	else if(percentile_value == 0){
		for(var i = 0; i < 365; i++){
			//orig_low_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0]);
			//orig_high_range[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range[i] = parseInt(sortedArray[0]);
			orig_high_range[i] = parseInt(sortedArray[full_range[i].length-1]);
			}
		}
	
        // Copy original high and low ranges to be an array that we can work with later if we want to (and not lose the original values)
	low_range = orig_low_range.slice();
	high_range = orig_high_range.slice();
	
        // Combine the high and low ranges to one plottable array
	for(var i = 0; i < 365; i++){
		plot_range[i] = [low_range[i], high_range[i]]; }
	//end of average range calculations
	
        // Calculate projection range
        // The same logic is used above for calulated range on current year data
        // Do the same procedure against the projection data to get the projection range
	
	var full_range = new Array(365);
	for(var i = 0; i < gNumberOfYears - 1; i++){
		tempYears[i] = new Array(365);
		for(var j = 0; j < projectionRangeStart; j++){
			tempYears[i][j] = 0; }
		}
	for(var i = 0; i < gNumberOfYears -1; i++){
		for(var j = projectionRangeStart; j < yearsArray[i].length; j++){
			tempYears[i][j] = parseInt(yearsArray[i][j] - yearsArray[i][projectionRangeStart-1]); }
		}
	
	for(var i = 0; i < 365; i++){
		full_range[i] = new Array();
		for(var j = gHistoryIndexStart; j < gHistoryIndexEnd; j++){
			full_range[i].push(tempYears[j][i]); }
		}
    
    sortedArray = [];
    sortedArray = full_range[364].sort(function(a,b){return a - b});
    gMaxGDDValue = Math.max(sortedArray[sortedArray.length-1],gMaxGDDValue);
    //console.log("full_range: "+full_range);
	
	if(percentile_value == 3){
		for(var i = 0; i < 365; i++){
			orig_low_range_projection[i] = 0;
			orig_high_range_projection[i] = 0;
			}
		}
	else if(percentile_value == 2){
		for(var i = 0; i < 365; i++){
			//orig_low_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0+10]);
			//orig_high_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1-10]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range_projection[i] = parseInt(sortedArray[0+10]);
			orig_high_range_projection[i] = parseInt(sortedArray[full_range[i].length-1-10]);
			}
		}
	else if(percentile_value == 1){
		for(var i = 0; i < 365; i++){
			//orig_low_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0+5]);
			//orig_high_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1-5]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range_projection[i] = parseInt(sortedArray[0+5]);
			orig_high_range_projection[i] = parseInt(sortedArray[full_range[i].length-1-5]);
			}
		}
	else if(percentile_value == 0){
		for(var i = 0; i < 365; i++){
			//orig_low_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[0]);
			//orig_high_range_projection[i] = parseInt(full_range[i].sort(function(a,b){return a - b})[full_range[i].length-1]);
			sortedArray = full_range[i].sort(function(a,b){return a - b});
			orig_low_range_projection[i] = parseInt(sortedArray[0]);
			orig_high_range_projection[i] = parseInt(sortedArray[full_range[i].length-1]);
			}
		}			
	low_range_projection = orig_low_range_projection.slice();
	high_range_projection = orig_high_range_projection.slice();

	// Store range for projection that is unaffected by Variation selection
	full_low_range_projection = new Array(365);
	full_high_range_projection = new Array(365);

	for(var i = 0; i < 365; i++){
		sortedArray = full_range[i].sort(function(a,b){return a - b});
		full_low_range_projection[i] = parseInt(sortedArray[0]);
		full_high_range_projection[i] = parseInt(sortedArray[full_range[i].length-1]);
	}

	// Calculate forcast (projection) range, use same logic as historical projection
	var full_range = new Array(forecast_model_length);

	// Copy forecast_models to temp array for sorting.
	for(var i = 0; i < forecast_model_length; i++){
		full_range[i] = new Array();
		for(var j = 0; j < gNumberOfModels; j++){
			full_range[i].push(forecast_models[j][i]);
		}
	}

	//sort the accumulated gdd each day, take the min and the max for range
	sortedArray = [];
	 for(var i = 0; i < full_range.length; i++){
		sortedArray = full_range[i].sort(function(a,b){return a - b});
		forecast_low[i] = parseInt(sortedArray[0]);
		forecast_high[i] = parseInt(sortedArray[full_range[i].length-1]);
	}

    var xAxisValueOffset = 0;
    if (projectionRangeStart > current_year_data.length) {
        startValue = 0; 
        xAxisValueOffset = projectionRangeStart - current_year_data.length;
        }
	plot_range_projection = new Array();
    //console.log("current_year_data: "+current_year_data);
    //console.log("low_range_projection: "+low_range_projection);
    //console.log("high_range_projection: "+high_range_projection);
	var range_offset = 0;
	// Calculate the offset as we transition from forecast range to projection range
	// No Range offset if no forecast
	if ( forecast_data_display > 0 ){
		//Adjusted projection line indicates where the projection line would have been without the influence of the forecast at the point of transition
		////var adjusted_projection = startValue + ( average_81to10_data[end_forecast-1] - average_81to10_data[projectionRangeStart-1] );
		var adjusted_projection = startValue + ( average_91to20_data[end_forecast-1] - average_91to20_data[projectionRangeStart-1] );
		range_offset = current_year_projection[forecast_data_display-1][1] - adjusted_projection;
	}

	for(var i = 0; i < 365-projectionRangeStart; i++){
		//Using forecast range calculated above
		if ( i + projectionRangeStart < end_forecast ){
			if ( percentile_value == 3 )
			  plot_range_projection[i] = [current_year_projection[i+xAxisValueOffset][0], startValue, startValue];
			else
				plot_range_projection[i] = [current_year_projection[i+xAxisValueOffset][0], forecast_low[i+projectionRangeStart], forecast_high[i+projectionRangeStart]];

			full_plot_range[i+projectionRangeStart] = [forecast_low[i+projectionRangeStart], forecast_high[i+projectionRangeStart]];
			//Capture overlap on transition to historical projection - prevents white gap between days
		}
		//Outside of forecast data, use projected data
		//Check that projection data exists
		else if ( low_range_projection[i+projectionRangeStart] != null && high_range_projection[i+projectionRangeStart] != null ){
			// Continue with projection range for greater than set forecast days (i.e. past 30 days)
			if ( forecast_low[end_forecast-1] && forecast_high[end_forecast-1] ){
				plot_range_projection[i] = [current_year_projection[i+xAxisValueOffset][0], startValue + low_range_projection[i+projectionRangeStart] - low_range_projection[projectionRangeStart-1] + range_offset, startValue + high_range_projection[i+projectionRangeStart] - high_range_projection[projectionRangeStart-1] + range_offset ];
				full_plot_range[i+projectionRangeStart] = [startValue + full_low_range_projection[i+projectionRangeStart] - full_low_range_projection[projectionRangeStart-1] + range_offset, startValue + full_high_range_projection[i+projectionRangeStart] - full_high_range_projection[projectionRangeStart-1] + range_offset ];
			}
			//forecast data not available for period, using only projection data
			else {
				plot_range_projection[i] = [current_year_projection[i+xAxisValueOffset][0], startValue + (low_range_projection[i+projectionRangeStart] - low_range_projection[projectionRangeStart-1]), startValue + (high_range_projection[i+projectionRangeStart] - high_range_projection[projectionRangeStart-1])];
				full_plot_range[i+projectionRangeStart] = [startValue + (full_low_range_projection[i+projectionRangeStart] - full_low_range_projection[projectionRangeStart-1]), startValue + (full_high_range_projection[i+projectionRangeStart] - full_high_range_projection[projectionRangeStart-1])];
			}
		}
	}
	
		// Once ranges are configured properly, move to configuring silk and black layer values and arrays
	determine_silk_blacklayer();
    gMaxGDDValue = Math.max(gdd_blacklayer,gMaxGDDValue);
    
	//var date = new Date();
	//console.log("end regraph: "+date);
}	// end "regraph"

$(document).ready(function()
{    
    $('#show_me').click(function() {
        var dont_run = false;
        $('*[data-intro-disabled]').each(function() {
            if ($(this).is(':visible')) {
                $(this).attr(
                    'data-intro',
                    $(this).data('intro-disabled')
                );
                    // Special Cases
                if ($(this).attr('class') == 'search_ol_intro' && $('#search_ol').css('margin-left') != '0px') {
                    $('#search_ol_button').click();
                    setTimeout(function (){
                        introJs().start();
                    	}, 500);
                    
                    dont_run = true;
                	}
            	}
            else {
                $(this).removeAttr('data-intro'); }
        	});
        
        if (dont_run == false) {
            introJs().start(); }
    	});
	
    $('.info-button').click(function()
    {
        $(this).parent().find('.info-content').slideToggle();
    });
	$('#site_info').parent().click(function()
    {
        if (site_info == false)
        {
            site_info = true;
        }
        else
        {
            site_info = false;   
        }
    });

$('#gddStartInfo').click(function () {
    var $this = $(this);
    $('#gddStartTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#percentileVariationTip').hide();
    $('#currentDayTip').hide();
});
$('#gddStartInfoData').click(function () {
    var $this = $(this);
    $('#gddStartTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#percentileVariationTip').hide();
    $('#currentDayTip').hide();
});

$('#cornMaturityInfo').click(function () {
    var $this = $(this);
    $('#cornMaturityTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#gddStartTip').hide();
    $('#percentileVariationTip').hide();
    $('#currentDayTip').hide();
});
$('#cornMaturityInfoData').click(function () {
    var $this = $(this);
    $('#cornMaturityTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#gddStartTip').hide();
    $('#percentileVariationTip').hide();
    $('#currentDayTip').hide();
});

$('#percentileVariationInfo').click(function () {
    var $this = $(this);
    $('#percentileVariationTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#gddStartTip').hide();
    $('#currentDayTip').hide();
});
$('#percentileVariationInfoData').click(function () {
    var $this = $(this);
    $('#percentileVariationTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#gddStartTip').hide();
    $('#currentDayTip').hide();
});

$('#currentDayInfo').click(function () {
    var $this = $(this);
    $('#currentDayTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#percentileVariationTip').hide();
    $('#gddStartTip').hide();
});
$('#currentDayInfoData').click(function () {
    var $this = $(this);
    $('#currentDayTip').css({
        left: $this.position().left + $this.width(),
        top: $this.position().top + $this.height(),
    }).toggle();

    $('#cornMaturityTip').hide();
    $('#percentileVariationTip').hide();
    $('#gddStartTip').hide();
});
    
    
    $('.gddDetailsCheckbox').on('change', function()
    	{
		if ($('.gddDetailsCheckbox').is(':checked')){
			$('#gdd_details').removeClass('gdd_details_hide');
			}
			
		else { // not checked.
			$('#gdd_details').addClass('gdd_details_hide');
			}
    	});
        

    // For the dropdown groups
    $('.dropdown-group').click(function(event)
    {
        event.stopPropagation();
        $('#download_data .dropdown-group-menu').toggle();
    });

    // Hide menus if visible
    $('html').click(function()
    {
        //Hide the menus if visible
        $('.dropdown-group-menu:visible').hide();
    });
    
    $('.gdd_data').click(function() {
        downloadGDDData();
        });
    
    $('.freeze_data').click(function() {
        downloadFreezeData();
        });

});	// end ".ready"


if (!jq) {
	var jq = $;
}
jQuery(document).ready(function(jq){
	var $ = jq;
	init();
});

// Display initial site info above all tabs only if first tab is selected
var site_info = true;

/**
*  selectTag
*  When a tab is selected, verify that all data is refreshed and shown correctly (hiding what needs hidden)
**/
function selectTag(showContent, selfObj) {
        //operate on tag
	if (selfObj.parentNode.className != 'selectTag') {
		var tag = document.getElementById("tags").getElementsByTagName("li");
		var taglength = tag.length;
		for (i = 0; i < taglength; i++) {
			//if(i != 3){
				//console.log(i);
				tag[i].className = "unselectTag";
                //}
            }
		selfObj.parentNode.className = "selectTag";
		//operate on content
		for (i = 0; j = document.getElementById("tagContent" + i); i++) {
				j.style.display = "none"; }
		document.getElementById(showContent).style.display = "block";
        }
        // If graph tab is selected, redraw the graph
	if (showContent == "tagContent1") {
		//console.log("gNewDataLoadedFlag: "+gNewDataLoadedFlag);
		if (gNewDataLoadedFlag) {
				// Do not need to call populate_list and regraph; already done.
			gNewDataLoadedFlag = false; }
		else { // !gNewDataLoadedFlag
			populate_list();
			refreshSelectedIndexGraph();
			regraph();
			}
		//var date = new Date();
		//console.log("ready to call chart: "+date);
		chart();
		//var date = new Date();
		//console.log("after call to chart: "+date);
        $('#download_data').show();
        }
        // If data tab is selected, refresh the data values
	else if (showContent == "tagContent2") {
		//console.log("tag 2 selected");
        $('#download_data').show();
		populate_list();
		refreshSelectedIndexData();
		updateDataTab();
		}

        // If animations tab is selected
	else if (showContent == "tagContent3") {
		//console.log("tag 3 selected");
        $('#download_data').hide();
        }

        // If map tab is selected, show information portions of the site above the map and resize/re-draw the map
	if (showContent == "tagContent0"){
        $('#download_data').hide();
		$('#info-button').show();
		$('#site_title').show().next().show();
		if(site_info){
			$('#site_info').show();	}
		else{
			$('#site_info').hide();	}
		//init();
		mapping.handleResizeWindow();
        }
	else{
		// Hide the data if anything other than map is to be displayed
		$('#info-button').hide();
		$('#site_title').hide();
		$('#site_info').hide();
        }
        // Hide all currently opened tool tips when switching tabs.
	$('#currentDayTip').hide();
	$('#cornMaturityTip').hide();
    $('#percentileVariationTip').hide();
    $('#gddStartTip').hide();
    
}	// end "selectTag"

function setBlacklayerFromDataCustomEntry() {
	var blacklayer_custom_field = document.getElementById("blacklayer_gddsData");
	var cornMaturityDropdown = document.getElementById('drop_maturityData');
	setBlacklayerValue(blacklayer_custom_field, cornMaturityDropdown);
	
	updateDataTab();
}

function setBlacklayerFromGraphCustomEntry() {
	var blacklayer_custom_field = document.getElementById("blacklayer_gdds");
	var cornMaturityDropdown = document.getElementById('drop_maturity');
	setBlacklayerValue(blacklayer_custom_field, cornMaturityDropdown);
	
	determine_silk_blacklayer();
	chart();
}

function setBlacklayerValue(blacklayer_custom_field, cornMaturityDropdown) {
	var local_gdd_blacklayer = parseFloat(blacklayer_custom_field.value);
	if (isNaN(local_gdd_blacklayer) || local_gdd_blacklayer < 1500 || local_gdd_blacklayer > 3500) {
       alert("The Black layer GDDs entry is not a valid number.\nUse a number between 1500 and 3500.\nThe last value will be used.");
		blacklayer_custom_field.value = gdd_blacklayer;
		}
	else {
		gdd_blacklayer = Math.round(local_gdd_blacklayer);
		gGDD_vn[gBlacklayerIndex] = gdd_blacklayer;
	
			// Force Maturity drop down menu to be "custom->"
		maturity_choice_index = cornMaturityDropdown.options.length - 1;
		cornMaturityDropdown.options[maturity_choice_index].selected = true;
		
		if (gdd_silk >= gdd_blacklayer) {
    		alert("Note that with the current gdd settings, black layer will occur at same time or before silking"); }
		}
}

function setMaturityValues(drop_maturity) {
	maturity_choice_index = drop_maturity.selectedIndex;
	var maturity_value = drop_maturity.options[maturity_choice_index].text;
	
		//"Custom->" must be selected. Use the custom values
	if(!isNaN(maturity_value)){
			// Set silking value
		gdd_silk = (11.459 * parseFloat(maturity_value)) + 100.27;
		gdd_silk = Math.round(gdd_silk);
		gGDD_vn[gSilkingIndex] = gdd_silk;
		
		gdd_blacklayer = (24.16 * parseFloat(maturity_value)) - 15.388;
		gdd_blacklayer = Math.round(gdd_blacklayer);
		gGDD_vn[gBlacklayerIndex] = gdd_blacklayer;
		}
}

function setMaturityValuesFromData() {
	var drop_maturity = document.getElementById('drop_maturityData');
	setMaturityValues(drop_maturity);
	document.getElementById('silking_gddsData').value = gdd_silk;
	document.getElementById('blacklayer_gddsData').value = gdd_blacklayer;
}

function setMaturityValuesFromGraph() {
	var drop_maturity = document.getElementById('drop_maturity');
	setMaturityValues(drop_maturity);
	document.getElementById('silking_gdds').value = gdd_silk;
	document.getElementById('blacklayer_gdds').value = gdd_blacklayer;
}

function setSilkingFromDataCustomEntry() {
	var silking_custom_field = document.getElementById("silking_gddsData");
	var cornMaturityDropdown = document.getElementById('drop_maturityData');
	setSilkingValue(silking_custom_field, cornMaturityDropdown);
	
	updateDataTab();
}

function setSilkingFromGraphCustomEntry() {
	var silking_custom_field = document.getElementById("silking_gdds");
	var cornMaturityDropdown = document.getElementById('drop_maturity');
	setSilkingValue(silking_custom_field, cornMaturityDropdown);
	
	determine_silk_blacklayer();
	chart();
}

function setSilkingValue(silking_custom_field, cornMaturityDropdown) {
	local_gdd_silk = parseFloat(silking_custom_field.value);
	if (isNaN(local_gdd_silk) || local_gdd_silk < 800 || local_gdd_silk > 1800) {
        alert("The Silking GDDs entry is not a valid number.\nUse a number between 800 and 1800.\nThe last value will be used.");
		silking_custom_field.value = gdd_silk;
		}
	else {
		gdd_silk = Math.round(local_gdd_silk);
		gGDD_vn[gSilkingIndex] = gdd_silk;
	
			// Force Maturity drop down menu to be "custom->"
		maturity_choice_index = cornMaturityDropdown.options.length - 1;
		cornMaturityDropdown.options[maturity_choice_index].selected = true;
		
		if (gdd_silk >= gdd_blacklayer) {
    		alert("Note that with the current gdd settings, silking will occur at same time or after black layer"); }
		}
}

// Set index selections when changes are made in the data tab
function setSelectedIndexData(){
	month_choice_index = document.getElementById('drop_monthsData').selectedIndex;
	day_choice_index = document.getElementById('drop_daysData').selectedIndex;
	maturity_choice_index = document.getElementById('drop_maturityData').selectedIndex;
	freeze_choice_index = document.getElementById('drop_freezeData').selectedIndex;
	percentile_choice_index = document.getElementById('drop_percentileData').selectedIndex;
	current_day_index = document.getElementById('drop_projection_startData').selectedIndex;

	/*console.log("Set Selected Index DATA");
	console.log("month => " + month_choice_index);
	console.log("day => " + day_choice_index);
	console.log("maturity => " + maturity_choice_index);
	console.log("freeze => " + freeze_choice_index);
	console.log("percentile => " + percentile_choice_index);
	console.log("current day => " + current_day_index);*/
}


// Set index selections when changes are made in the graph tab
function setSelectedIndexGraph(){
	month_choice_index = document.getElementById('drop_months').selectedIndex;
	day_choice_index = document.getElementById('drop_days').selectedIndex;
	selected_comparisons = [];
	if ( gl_using_select2 ){
		$("#drop_comparison").select2("data").forEach(function(data) {
			selected_comparisons.push(data.id);
		});
	}
	else if ( $("#drop_comparison").val() ){
		selected_comparisons = 	$("#drop_comparison").val();
	}
	// Max selections should be enforced via jQuery, but let's make sure no more than 3 are selected
	if ( selected_comparisons.length > 3 ){
		selected_comparisons.pop();
	}
	maturity_choice_index = document.getElementById('drop_maturity').selectedIndex;
	freeze_choice_index = document.getElementById('drop_freeze').selectedIndex;
	percentile_choice_index = document.getElementById('drop_percentile').selectedIndex;
	current_day_index = document.getElementById('drop_projection_start').selectedIndex;
	
	/*console.log("Set Selected Index GRAPH");
	console.log("month => " + month_choice_index);
	console.log("day => " + day_choice_index);
	console.log("maturity => " + maturity_choice_index);
	console.log("freeze => " + freeze_choice_index);
	console.log("percentile => " + percentile_choice_index);
	console.log("current day => " + current_day_index);*/
}

// Upper cases words
function ucwords(str)
{
    str = str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
        return letter.toUpperCase();
    });

    return str;
}

function show_me_specific_item(element, introItem) { 
	//console.log(element);
    
    if (gSingleIntroJSCallFlag) {
    	//console.log("in single introJS return flag");
    	return; }
    	
		// Need to make sure no other intros are already loaded.       
	$('*[data-intro]').each(function() {
		$(this).removeAttr('data-intro'); //}
		});
		
	$(element).attr('data-intro', $(element).data('intro-disabled'));
	//introJs().setOption("showStepNumbers", false);
	gSingleIntroJSCallFlag = true;
	introJs().start().oncomplete(onIntroJSExit).onexit(onIntroJSExit);
		
}	// end "show_me_specific_item"

function updateDataTab(){
	document.getElementById('dataLocationLL').innerHTML='' + latitude.toFixed(3) + ', ' + longitude.toFixed(3);
	document.getElementById('dataLocationCS').innerHTML='' + county + ' Co., ' + state;
	
	// Variable for the use of the current year or previous year in calculations
	var useCurrentYear = true;
	var useCurrentDate = true;
	
	// Set up date variable to determine today's date. Note that if today's date is later than for the "gCurrentYear" setting then
	// today's date will be set to December 31, gCurrentYear. This implies that we have turned over to a new year; the tool has not
	// been updated to handle the data for the new year.
	var date = new Date();
	//console.log ("date (updateDataTab): " + date);
	if (date.getFullYear() > gCurrentYear) {
		date = new Date(gCurrentYear, 12-1, 31, 0, 0, 0); }

	var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
	
	if(document.getElementById('drop_projection_startData').options[document.getElementById('drop_projection_startData').selectedIndex].text.indexOf(gPrevYear) != -1)
		useCurrentYear = false;
	// Set "Today's Date" label in user input section
	if(document.getElementById('drop_projection_startData').selectedIndex == 0){
		document.getElementById('dataTodaysDate').innerHTML='' + monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
	}
	else{
		document.getElementById('dataTodaysDate').innerHTML='' + document.getElementById('drop_projection_startData').options[document.getElementById('drop_projection_startData').selectedIndex].text;
		useCurrentDate = false;
	}
	
	var startMonth = document.getElementById('drop_monthsData').options[document.getElementById('drop_monthsData').selectedIndex].text;
	var startDay = document.getElementById('drop_daysData').options[document.getElementById('drop_daysData').selectedIndex].text;
	var startYear = gCurrentYear;
	if(!useCurrentYear){
		startYear = gCurrentYear - 1; }
	document.getElementById('dataStartingDate').innerHTML='' + startMonth + ' ' + startDay + ', ' + startYear;
	
	var maturityDays = document.getElementById('drop_maturityData').options[document.getElementById('drop_maturityData').selectedIndex].text;
	if (isNaN(maturityDays)) {
		html = 'Custom'; }
	else { //!isNaN(maturityDays)
		html = ''+maturityDays+' days'; }
	document.getElementById('dataMaturity').innerHTML=html;
	document.getElementById('dataGDDSilking').innerHTML='' + gdd_silk;
	document.getElementById('dataGDDBlackLayer').innerHTML='' + gdd_blacklayer;
	
	var day = current_day;
	// get current day number if "Today" is selected "Current Day"
	if(current_day == -1){
		var now = date;
		var start = new Date(now.getFullYear(), 0, 0);
		var diff = now - start;
		var oneDay = 1000 * 60 * 60 * 24;
		day = Math.floor(diff / oneDay);
	}
	// Get vegetation stage information.
	
	determine_vegetationstages_date (start_date, day, current_year_data, current_year_projection, plot_range_projection);

	// Determine if "current day" is before "GDD start" date
	// If before, don't display the gdd accumulation data
	var displayGDDAccumulation = false;
	var startMonthIndex = document.getElementById('drop_monthsData').options[document.getElementById('drop_monthsData').selectedIndex].index;
	var startDayIndex = document.getElementById('drop_daysData').options[document.getElementById('drop_daysData').selectedIndex].index;
	var currentMonthIndex = date.getMonth();
	var currentDayIndex = date.getDate()-1;
	var currentDayOfYear;

	if(useCurrentYear)
		document.getElementById('YearColumnLabel').innerHTML = 'This Year ('+gCurrentYear+")";
	else
		document.getElementById('YearColumnLabel').innerHTML = 'Last Year ('+(gCurrentYear-1)+")";		
		
	// Use current date in year
	if(useCurrentDate){
		currentDayOfYear = getDayOfYear (gCurrentYear, currentMonthIndex+1, currentDayIndex+1);
		if(currentMonthIndex < startMonthIndex){
			displayGDDAccumulation = false;	}
		else if(currentMonthIndex == startMonthIndex){
			if(currentDayIndex < startDayIndex+1){
				displayGDDAccumulation = false;	}
			else{
				displayGDDAccumulation = true; }
			}
		else{
			displayGDDAccumulation = true; }
		}
	else{
		// "Current Day" is a previous day	
		if(document.getElementById('drop_projection_startData').selectedIndex == 1){
			currentMonthIndex = 11;
			currentDayIndex = 31;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 2){
			currentMonthIndex = 8;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 3){
			currentMonthIndex = 7;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 4){
			currentMonthIndex = 6;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 5){
			currentMonthIndex = 5;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 6){
			currentMonthIndex = 4;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 7){
			currentMonthIndex = 3;
			currentDayIndex = 0;
			}
		else if(document.getElementById('drop_projection_startData').selectedIndex == 8){
			currentMonthIndex = 2;
			currentDayIndex = 0;
			}
		
		currentDayOfYear = getDayOfYear (gCurrentYear-1, currentMonthIndex+1, currentDayIndex+1);
        //console.log("currentDayOfYear for previous year: "+currentDayOfYear);
		
		if(currentMonthIndex < startMonthIndex){
			displayGDDAccumulation = false;	}
		else if(currentMonthIndex == startMonthIndex){
			if(currentDayIndex < startDayIndex){
				displayGDDAccumulation = false;	}
			else{
				displayGDDAccumulation = true; }
			}
		else{
			displayGDDAccumulation = true; }
		}
	//console.log("displayGDDAccumulation = " + displayGDDAccumulation);
	
	var blacklayerDateAverage = 0;
	
	var gddAccumulation = 0;
	var gddAccumulationAverage = 0;
	var gddAccumulationArray = new Array();
	// Display correct labels if start date and current day don't coincide correctly
	if(displayGDDAccumulation){		
		// Set labels for GDD accumulation information
		//document.getElementById('dataDateRange').innerHTML='(' + monthNames[startMonthIndex] + ' ' + (startDayIndex+1) + ' - ' + monthNames[currentMonthIndex] + ' ' + (currentDayIndex) + ')';
		// current day is 1-indexed, the array is 0 indexed
		// difference number of days could potentially happen
		// depends on update script runtime
		if((day-2) > current_year_data.length){
			gddAccumulation = current_year_data[current_year_data.length-1];
			for(var i = 0; i < all_previous_years.length-3; i++){
				gddAccumulationAverage += all_previous_years[i][current_year_data.length-1];
				gddAccumulationArray.push(all_previous_years[i][current_year_data.length-1]);
                }
			//console.log("gddAccumulation in current year: "+gddAccumulation);
            }
		else{
			gddAccumulation = current_year_data[day-2];
			for(var i = 0; i < all_previous_years.length-3; i++){
				gddAccumulationAverage += all_previous_years[i][day-2];
				gddAccumulationArray.push(all_previous_years[i][day-2]);
                }
			//console.log("gddAccumulation in previous year: "+gddAccumulation);
            }
		document.getElementById('GDDAccumCurrent').innerHTML = '' + gddAccumulation;
		gddAccumulationAverage /= all_previous_years.length-3;
		document.getElementById('GDDAccumAverage').innerHTML = '' + Math.floor(gddAccumulationAverage);
		//console.log(gddAccumulationArray);
		gddAccumulationArray.sort(function(a,b){return a-b;});
		//console.log(gddAccumulationArray);
		if(document.getElementById('drop_percentileData').selectedIndex == 0){
			document.getElementById('GDDAccumEarlyLabel').innerHTML = 'Occurs within this range for all years';
			document.getElementById('GDDAccumEarly').innerHTML = gddAccumulationArray[0] + ' - ' + gddAccumulationArray[gddAccumulationArray.length-1];
			}
		else if(document.getElementById('drop_percentileData').selectedIndex == 1){
			document.getElementById('GDDAccumEarlyLabel').innerHTML = 'Occurs within this range for middle 20 years';
			document.getElementById('GDDAccumEarly').innerHTML = gddAccumulationArray[4] + ' - ' + gddAccumulationArray[gddAccumulationArray.length-6];
			}
		else if(document.getElementById('drop_percentileData').selectedIndex == 2){
			document.getElementById('GDDAccumEarlyLabel').innerHTML = 'Occurs within this range for middle 10 years';
			document.getElementById('GDDAccumEarly').innerHTML = gddAccumulationArray[9] + ' - ' + gddAccumulationArray[gddAccumulationArray.length-11];
			}
		else if(document.getElementById('drop_percentileData').selectedIndex == 3){
			document.getElementById('GDDAccumEarlyLabel').innerHTML = 'Median';
			document.getElementById('GDDAccumEarly').innerHTML = gddAccumulationArray[14];
			}
		
			// List information for vegetation stages.
		listCurrentYearVegetationStageInfo (gV2Index, 'v2DateLabel', 'v2DateCurrent');
		listCurrentYearVegetationStageInfo (gV4Index, 'v4DateLabel', 'v4DateCurrent');
		listCurrentYearVegetationStageInfo (gV6Index, 'v6DateLabel', 'v6DateCurrent');
		listCurrentYearVegetationStageInfo (gV8Index, 'v8DateLabel', 'v8DateCurrent');
		listCurrentYearVegetationStageInfo (gV10Index, 'v10DateLabel', 'v10DateCurrent');
		listCurrentYearVegetationStageInfo (gSilkingIndex, 'silkingDateLabel', 'silkingDateCurrent');	
		listCurrentYearVegetationStageInfo (gBlacklayerIndex, 'blacklayerDateLabel', 'blacklayerDateCurrent');	
		
            // Set spring freeze labels
		//console.log(all_last_freezes_data);
		var allSpringFreezeDates = new Array();
		for(var i = 0; i < all_last_freezes_data.length; i++){
			if(all_last_freezes_data[i] != 0){
				for(var j = 0; j < all_last_freezes_data[i]; j++){
					// Biehl on 11/4/2014; changed i to i+1 so that date string will be correct below in getDateString()
					allSpringFreezeDates.push(i+1); }
                }
            }
		//var springFreezeDateAverage = 0;
		//for(var i = 0; i < allSpringFreezeDates.length; i++){
		//	springFreezeDateAverage += allSpringFreezeDates[i]; }
		//springFreezeDateAverage /= Math.ceil(allSpringFreezeDates.length);
		//document.getElementById('springFreezeAverage').innerHTML = getDateString(springFreezeDateAverage);
		document.getElementById('springFreezeAverage').innerHTML = getDateString(average30YearLastFreeze);
		
            // Set fall freeze labels
		var allFallFreezeDates = new Array();
		for(var i = 0; i < all_first_freezes_data.length; i++){
			if(all_first_freezes_data[i] != 0){
				for(var j = 0; j < all_first_freezes_data[i]; j++){
					// Biehl on 11/4/2014; changed i to i+1 so that date string will be correct below in getDateString()
					allFallFreezeDates.push(i+1); }
                }
            }
		
		//fallFreezeDateAverage = 0;
		//for(var i = 0; i < allFallFreezeDates.length; i++){
		//	fallFreezeDateAverage += allFallFreezeDates[i]; }
		//fallFreezeDateAverage /= Math.ceil(allFallFreezeDates.length);
		//document.getElementById('fallFreezeAverage').innerHTML = getDateString(fallFreezeDateAverage);
		document.getElementById('fallFreezeAverage').innerHTML = getDateString(average30YearFirstFreeze);
		
		//console.log(allSpringFreezeDates);
		//console.log(allFallFreezeDates);
            // set both early and late, spring and fall freeze labels
		if(document.getElementById('drop_percentileData').selectedIndex != 3){
			document.getElementById('springFreezeEarly').innerHTML = getDateString(allSpringFreezeDates[0],startYear) + ' - ' + getDateString(allSpringFreezeDates[allSpringFreezeDates.length-1],startYear);
			document.getElementById('fallFreezeEarly').innerHTML = getDateString(allFallFreezeDates[0],startYear) + ' - ' + getDateString(allFallFreezeDates[allFallFreezeDates.length-1],startYear);
            }
		else{
			document.getElementById('springFreezeEarly').innerHTML = getDateString(allSpringFreezeDates[Math.ceil(allSpringFreezeDates.length/2)]);
			document.getElementById('fallFreezeEarly').innerHTML = getDateString(allFallFreezeDates[Math.ceil(allFallFreezeDates.length/2)]);
            }
		$('#checkDateLabel').hide();
        }
	else{
		//document.getElementById('gddAccumulationLabel').innerHTML='GDD Accumulation (Verify \'Start Date\' and \'Current Date\')';
		document.getElementById('gddAccumulationLabel').innerHTML='GDD Accumulation (not available)';
		document.getElementById('GDDAccumCurrent').innerHTML='**';
		document.getElementById('GDDAccumAverage').innerHTML='**';
		document.getElementById('GDDAccumEarly').innerHTML='**';
		document.getElementById('v2DateLabel').innerHTML = gGDD_vn_label[gV2Index]+" Date";
		document.getElementById('v2DateCurrent').innerHTML = '**';
		document.getElementById('v4DateLabel').innerHTML = gGDD_vn_label[gV4Index]+" Date";
		document.getElementById('v4DateCurrent').innerHTML = '**';
		document.getElementById('v6DateLabel').innerHTML = gGDD_vn_label[gV6Index]+" Date";
		document.getElementById('v6DateCurrent').innerHTML = '**';
		document.getElementById('v8DateLabel').innerHTML = gGDD_vn_label[gV8Index]+" Date";
		document.getElementById('v8DateCurrent').innerHTML = '**';
		document.getElementById('v10DateLabel').innerHTML = gGDD_vn_label[gV10Index]+" Date";
		document.getElementById('v10DateCurrent').innerHTML = '**';
		document.getElementById('silkingDateLabel').innerHTML = gGDD_vn_label[gSilkingIndex]+" Date";
		document.getElementById('silkingDateCurrent').innerHTML = '**';
		document.getElementById('blacklayerDateLabel').innerHTML = gGDD_vn_label[gBlacklayerIndex]+" Date";
		document.getElementById('blacklayerDateCurrent').innerHTML = '**';
		document.getElementById('springFreezeCurrent').innerHTML = '';
		document.getElementById('springFreezeAverage').innerHTML = '**';
		document.getElementById('springFreezeEarly').innerHTML = '**';
		document.getElementById('fallFreezeCurrent').innerHTML = '';
		document.getElementById('fallFreezeAverage').innerHTML = '**';
		document.getElementById('fallFreezeEarly').innerHTML = '**';
		$('#checkDateLabel').show();
	
            // Set spring freeze labels
		//console.log(all_last_freezes_data);
		var allSpringFreezeDates = new Array();
		for(var i = 0; i < all_last_freezes_data.length; i++){
			if(all_last_freezes_data[i] != 0){
				for(var j = 0; j < all_last_freezes_data[i]; j++){
					// Biehl on 11/4/2014; changed i to i+1 so that date string will be correct below in getDateString()
					allSpringFreezeDates.push(i+1); }
                }
            }
		var springFreezeDateAverage = 0;
		for(var i = 0; i < allSpringFreezeDates.length; i++){
			springFreezeDateAverage += allSpringFreezeDates[i]; }
		springFreezeDateAverage /= Math.ceil(allSpringFreezeDates.length);
		document.getElementById('springFreezeAverage').innerHTML = getDateString(springFreezeDateAverage);
		
            // Set fall freeze labels
		var allFallFreezeDates = new Array();
		for(var i = 0; i < all_first_freezes_data.length; i++){
			if(all_first_freezes_data[i] != 0){
				// Biehl on 11/4/2014; removed /500. Not needed now since number freeze years for a date has its own scale
				for(var j = 0; j < all_first_freezes_data[i]; j++){
					// Biehl on 11/4/2014; changed i to i+1 so that date string will be correct below in getDateString()
					allFallFreezeDates.push(i+1); }
                }
            }
		
		fallFreezeDateAverage = 0;
		for(var i = 0; i < allFallFreezeDates.length; i++){
			fallFreezeDateAverage += allFallFreezeDates[i]; }
		fallFreezeDateAverage /= Math.ceil(allFallFreezeDates.length);
		document.getElementById('fallFreezeAverage').innerHTML = getDateString(fallFreezeDateAverage);
		
		//console.log(allSpringFreezeDates);
		//console.log(allFallFreezeDates);
            // set both early and late, spring and fall freeze labels
		if(document.getElementById('drop_percentileData').selectedIndex != 3){
			document.getElementById('springFreezeEarly').innerHTML = getDateString(allSpringFreezeDates[0]) + ' - ' + getDateString(allSpringFreezeDates[allSpringFreezeDates.length-1]);
			document.getElementById('fallFreezeEarly').innerHTML = getDateString(allFallFreezeDates[0]) + ' - ' + getDateString(allFallFreezeDates[allFallFreezeDates.length-1]);
            }
		else{
			document.getElementById('springFreezeEarly').innerHTML = getDateString(allSpringFreezeDates[Math.ceil(allSpringFreezeDates.length/2)]);
			document.getElementById('fallFreezeEarly').innerHTML = getDateString(allFallFreezeDates[Math.ceil(allFallFreezeDates.length/2)]);
            }
        }
	
		// List 1991-2020 history information.
	listThirtyYearHistoryInfoForVegetationStage (gV2Index, 'v2DateAverage', 'v2DateRange');		
	listThirtyYearHistoryInfoForVegetationStage (gV4Index, 'v4DateAverage', 'v4DateRange');
	listThirtyYearHistoryInfoForVegetationStage (gV6Index, 'v6DateAverage', 'v6DateRange');
	listThirtyYearHistoryInfoForVegetationStage (gV8Index, 'v8DateAverage', 'v8DateRange');
	listThirtyYearHistoryInfoForVegetationStage (gV10Index, 'v10DateAverage', 'v10DateRange');
	listThirtyYearHistoryInfoForVegetationStage (gSilkingIndex, 'silkingDateAverage', 'silkingDateEarly');
	listThirtyYearHistoryInfoForVegetationStage (gBlacklayerIndex, 'blacklayerDateAverage', 'blacklayerDateEarly');
	
	document.getElementById('frostResultsLabel').innerHTML = "<b>Freeze Results (" + (freeze_choice_index+25) + "&degF)</b>";
	document.getElementById('springFrostLabel').innerHTML = "Freeze Probability after " + monthNames[startMonthIndex] + ' ' + (startDayIndex+1);
	start_date_value = getDayOfYear (startDayIndex, startMonthIndex+1, startDayIndex+1);
	var temp_percentile_choice_index = percentile_choice_index;
	percentile_choice_index = 0; 
	refreshSelectedIndexGraph();
	determine_freeze();
	var total_freeze_count = 0;
	var freeze_count_after_plant = 0;
	//console.log(last_freeze_strings);
	//console.log(start_date_value);
	for(var i = 0; i < last_freeze_strings.length; i++){
		if(last_freeze_strings[i].length > 0){
			total_freeze_count += last_freeze_strings[i].split(", ").length;
			if(i >= start_date_value){
				freeze_count_after_plant += last_freeze_strings[i].split(", ").length; }				
			}
		}
	//console.log("total = " + total_freeze_count + " after count = " + freeze_count_after_plant);
	document.getElementById('springFrostCurrent').innerHTML = Math.ceil(100*(freeze_count_after_plant/total_freeze_count)) + "%";
	
	var freezeBLPct = freezeBlacklayerCalc();
	var displayFreezeBL = "";
	// Adjust display of freeze before blacklayer percentage so absolutes 0 & 100 are not displayed
	if ( freezeBLPct < 1 )
		displayFreezeBL = "<1";
	else if ( freezeBLPct > 99 )
		displayFreezeBL = ">99";
	else
		displayFreezeBL = freezeBLPct.toFixed(0);
	
	document.getElementById('fallFrostCurrent').innerHTML = displayFreezeBL+"%";

	percentile_choice_index = temp_percentile_choice_index;
	
	var tmp_min_data;
	if(startYear == gCurrentYear){
		tmp_min_data = minimum_current_data.slice(); }
	else{
		tmp_min_data = minimum_previous_data.slice(); }
	var tmp_day = (tmp_min_data.length > 181) ? 181 : tmp_min_data.length-1;
	var last_freeze_date;
	for(var last_freeze_date = tmp_day; last_freeze_date > 0; last_freeze_date--){
		if(tmp_min_data[last_freeze_date] <= (freeze_choice_index+25)){
			break; }
		if(last_freeze_date == 0){
			last_freeze_date = -1; }
        }
	
	var last_freeze_string = (last_freeze_date == -1) ? "None" : getDateString(last_freeze_date+1);
	document.getElementById('springFreezeCurrent').innerHTML = last_freeze_string;
	
	latestAvailableDataDay = Math.min(tmp_min_data.length, currentDayOfYear);
    if (!useCurrentDate)
        latestAvailableDataDay--;
	
    if(displayGDDAccumulation) {
        document.getElementById('gddAccumulationLabel').innerHTML='GDD Accumulation (' + monthNames[startMonthIndex] + ' ' + (startDayIndex+1) + ' - ' + getDateString(latestAvailableDataDay, startYear) + ')'; }
		
        // Don't forget to change the "Latest Data Available" info
	if(startYear == gCurrentYear){
		document.getElementById('dataLatestDataAvailable').innerHTML = getDateString(latestAvailableDataDay, startYear) + ", "+gCurrentYear; }
	else{
		document.getElementById('dataLatestDataAvailable').innerHTML = getDateString(latestAvailableDataDay, startYear) + ", "+(gCurrentYear-1); }
		
		// Now complete the detail table.
	//console.log("gVnEarliestDayOfYear: "+gVnEarliestDayOfYear);
	//console.log("gVnDayOfYear: "+gVnDayOfYear);
	//console.log("gVnLatestDayOfYear: "+gVnLatestDayOfYear);
	updateAccumulatedGDDDetailsTable(start_date, startYear, day);
	
}	// end "updateDataTab"


function updateAccumulatedGDDDetailsTable(start_date, startYear, currentDay) {
	var date;
	var dateString;
	var lastDay;
	
	var table = document.getElementById("gddDetailsListTableID");
	
		// Get the number of rows in the table and remove all but the first one.
	var numberRows = document.getElementById("gddDetailsListTableID").rows.length;
	if (numberRows > 1) {
		for (var i=numberRows-1; i>0; i--) {
			table.deleteRow(i); }
		}
		
		// Make sure currentDay is not later than the last day in the current_year_data array.	
		//console.log("currentDay: "+ currentDay);	
		//console.log("current_year_data.length: "+ current_year_data.length);
	currentDay = Math.min(currentDay, current_year_data.length+1);
	
		// Get the last day to be listed. Currently is 30 days after black layer or to the end of the year
	//console.log("gVnDayOfYear[gBlacklayerIndex]: "+gVnDayOfYear[gBlacklayerIndex]);
    var endDay;
    //if (gVnLatestDayOfYear[gBlacklayerIndex] <= 0) {
   //     endDay = 365; }
	//else {  // gVnLatestDayOfYear[gBlacklayerIndex] > 0
        endDay = Math.min(gVnLatestDayOfYear[gBlacklayerIndex] + 30, 365); //}
		
	var row;
	var cell;
	tableRowIndex = 1;
	lastDay = Math.min(endDay, currentDay);

	//Special case for data table display on year rollover
	if (currentDay == 365 && current_year_data.length == 365)
		lastDay++
    //console.log("currentDay: "+currentDay);
    //console.log("lastDay: "+lastDay);
		// Add rows for the current data
	var i;
	for (i=start_date; i<lastDay; i++) {
			// Create an empty <tr> element and add it to the 2nd position of the table:
		row = table.insertRow(tableRowIndex);
		//row.height="10";

			// Insert new cells into the row.
			// Date
		date = dateFromDay(startYear, i);
		dateString = date.toUTCString().split(' ')[2]+" "+date.toUTCString().split(' ')[1];
		(row.insertCell(0)).innerHTML = dateString;
		
			// Accumulated GDDs to the date.
		(row.insertCell(1)).innerHTML = current_year_data[i-1];
		
		// Daily GDD
		if ( current_year_data[i-2] != null)
			(row.insertCell(2)).innerHTML = current_year_data[i-1] - current_year_data[i-2];
		else
			(row.insertCell(2)).innerHTML = current_year_data[i-1];

			// Note estimated vegetation stage start
		(row.insertCell(3)).innerHTML = getVegetationStageForDay(i);
		
		// GDDs based on NWS Forecast Data; Not use for current day data.
		cell = row.insertCell(4);

			// 1991-2020 Range; Not used for current day data.
		cell = row.insertCell(5);

		////(row.insertCell(6)).innerHTML = average_81to10_data[i-1];
		(row.insertCell(6)).innerHTML = average_91to20_data[i-1];

		tableRowIndex++;		
		}
	var lastRecordedGDD = current_year_data[i-2];
		
	lastDay = endDay-currentDay;
	var startEstimatedDay = 0;
	if (currentDay < start_date) {
		startEstimatedDay = start_date - currentDay; }
	if (current_year_data.length < 365 && lastDay >= 0 && currentDay > 0) {
      	//console.log("currentDay: "+currentDay);
      	//console.log("endDay: "+endDay);
      	//console.log("lastDay: "+lastDay);
			//console.log ("startEstimatedDay: " + startEstimatedDay);
			//console.log ("start_date: " + start_date);
		var vegStageDescription = [];
		var dateCell;
		var forecastSize = Math.min(forecast_data_display, Math.max(forecast_mean.length - current_year_data.length,0));
		for (var i=startEstimatedDay; i<=lastDay; i++) {
				// Create an empty <tr> element and add it to the 2nd position of the table:
			row = table.insertRow(tableRowIndex);
			//row.height="10";

				// Insert new cells into the row.
				// Date
			date = dateFromDay(startYear, currentDay+i);
			dateString = date.toUTCString().split(' ')[2]+" "+date.toUTCString().split(' ')[1];
		
			dateCell = row.insertCell(0);
			dateCell.innerHTML = dateString;
			dateCell.style.color = '#888888';
		
				// Accumulated GDDs for to the date.
			cell = row.insertCell(1);
			cell.innerHTML = current_year_projection[i][1]+' est';
			cell.style.color = '#888888';
		
				// Daily GDD estimates
			cell = row.insertCell(2);
			if ( current_year_projection[i-1] != null)
				cell.innerHTML = current_year_projection[i][1] - current_year_projection[i-1][1] + ' est';
			else if ( lastRecordedGDD != null)
				cell.innerHTML = current_year_projection[i][1] - lastRecordedGDD + ' est';
			else
				cell.innerHTML = "N/A"
			cell.style.color = '#888888';

				// Note estimated vegetation stage start
			cell = row.insertCell(3);
			vegStageDescription = getVegetationStageForDayProjected(currentDay+i);
			cell.innerHTML = vegStageDescription[0];
			cell.style.color = '#888888';
			if (vegStageDescription[1] == 1) {
				dateCell.style.fontWeight='bold'; 
				cell.style.fontWeight='bold'; 
				}

			// GDDs based on NWS Forecast Data
			cell = row.insertCell(4);
			cell.style.color = '#888888';
			if ( i <  forecastSize ){
				cell.innerHTML = full_plot_range[currentDay-1+i][0] + ' - ' + full_plot_range[currentDay-1+i][1] ;
			}
			else
				cell.innerHTML = '';

				// 1991-2020 Range
			cell = row.insertCell(5);
			cell.style.color = '#888888';
			if ( i >= forecastSize ) {
				if (startEstimatedDay == 0) {
					cell.innerHTML = full_plot_range[currentDay-1+i][0]+"-"+full_plot_range[currentDay-1+i][1];
				}
				else {	// startEstimatedDay > 0
				// currentDay is 1 indexed
					cell.innerHTML = full_plot_range[currentDay-1+i][0]+"-"+full_plot_range[currentDay-1+i][1];
				}
			}
			else
				cell.innerHTML = '';

			////(row.insertCell(6)).innerHTML = average_81to10_data[currentDay-1+i];
			(row.insertCell(6)).innerHTML = average_91to20_data[currentDay-1+i];

			tableRowIndex++;		
			}
		}	// end "if (currentDay > 0 && lastDay >= 0)"

	//Remove forecast from data table if not using today as current date
	if ( !document.getElementById('drop_projection_start').options[0].selected ){
		$("#gddDetailsListTableID tr").not(":eq(0)").each(function() {
			$(this).find("td:eq(4)").text("N/A");
		});
	}

}	// end "updateAccumulatedGDDDetailsTable"

