
// Customizable variables

// Key variables
var animationKey;
var timeKey;
var latColKey = "latitude";
var longColKey = "longitude";
var pointColorKey = "city";

//animation variables
var animateIt = false;

// zoom scales
var minZoomScale = 1;
var maxZoomScale = 8;

// Map strokes
var countiesStrokeWidth = 0.2;
var countiesStrokeColor = "#ffffff";
var statesStrokeWidth = 1;
var statesStrokeColor = "#ffffff";
var nationStrokeWidth = .1;
var nationStrokeColor = "#ffffff";

var landColor = "#dddddd";
var waterColor = "#ffffff";

var drawCounties = true;
var drawStates = true;

// Point vars
var radius = 5;
var pointOutlineColor = "#000000";
var pointOutlineWidth = .2;
var pointOpacity = 1;

var width = 960;
var height = 600;
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
var g = svg.append("g");;
var map = $("#map");
var zoomToRemove = false;
var data = null;
var projection;
var path;

// Paths
var usPath = null;
var countyOutlines;
var stateOutlines;
var nationOutline;

// Id Maps
var stateIdMap = d3.map();
var countyIdMap = d3.map();
var keys;

function generate() {
	// CREATE AND PREPARE MAPS _______________________________________
	projection = d3.geoAlbers()
					.translate([width / 2, height / 2])
					.scale(1270);
	path = d3.geoPath();

	var ctloadval = "";
	var ctloadmap;

	if (usPath == null) {
		d3.queue()
		    .defer(loadUS)
		    .defer(d3.csv, "data/statesMapId.csv", function(d) { stateIdMap.set(d.key.toUpperCase(), d.val); })
		    .defer(d3.csv, "data/countiesMapId.csv", function(d) { 
		    	if (ctloadval == "") {
		    		ctloadmap = d3.map();
		    		ctloadval = d.st;
		    	} else if (ctloadval != d.st) {
		    		countyIdMap.set(ctloadval.toUpperCase(), ctloadmap);
		    		ctloadval = d.st;
		    		ctloadmap = d3.map();
		    	} 
		    	ctloadmap.set(d.ct.toUpperCase(), d.val);
		    })
		    .await(makeVisualizations);
	} else {
		makeVisualizations();
	}
}

function loadData(callback) {   
	d3.json("/data/1000cities.json", function(d) { //d3.csv
		data = d;
	  	keys = Object.keys(d[0]);
		$(".add-keynames").each(function() {
			$(this).empty();
			for (var j = 0; j < keys.length; j++) {
				$(this).append($("<option></option>")
			        	.attr("value",keys[j])
			        	.text(keys[j]));
			}
		});
		callback(null);
	});
}

function makeVisualizations() { 
	var zoom = d3.zoom().scaleExtent([minZoomScale, maxZoomScale])
		.on("zoom", function() { g.attr("transform", d3.event.transform); });
	svg.call(zoom);

	if (data == null) {
		d3.queue()
			.defer(loadData)
		.await(getAndDrawUSforPoints)
	} else {
		getAndDrawUSforPoints();
	}
}


function drawPoints() {
	var colorRange = d3.scaleOrdinal()
		.domain(d3.map(data, function(d) {return (d[pointColorKey] + ", " + d['state'])}).keys()) // this may be wrong
		.range(d3.schemeCategory20); //if more, do schemeCategory10

	var fillfunction = function (d) { return colorRange(d[pointColorKey] + ", " + d['state']); };

 	var enterAttributes = {
		cx: function (d) { 
			var coords = [d[longColKey], d[latColKey]];
			return projection(coords)[0]; 
		},
		cy: function (d) { 
			var coords = [d[longColKey], d[latColKey]];
			return projection(coords)[1];  
		},
		opacity: pointOpacity,
		"stroke-width": pointOutlineWidth,
		stroke: pointOutlineColor,
		r: radius,
		fill: fillfunction,
	}

	var updateAttributes = {};

	if (!animateIt) {
		g.selectAll("circle")
		    .data(data)
		    .enter()
		    .append("circle")
		    .attrs(enterAttributes)
		    .attrs(updateAttributes)
		    .on("mouseover", function(d, i) {
		    	d3.select(this).attrs({
		    		//fill: "orange",
  					r: radius * 1.4
  				});
  				var xPosition = d3.mouse(this)[0];
                var yPosition = d3.mouse(this)[1];

                svg.append("text")
                    .attr("id", "tooltip")
                    .attr("x", xPosition)
                    .attr("y", yPosition)
                    .attr("text-anchor", "middle")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "11px")
                    .attr("font-weight", "bold")
                    .attr("fill", "black")
                    .text(d[pointColorKey] + ", " + d['state']);
		    })
            .on("mouseout", function(d, i) {
		    	d3.select(this).attrs({
		    		//fill: fillfunction,
  					r: radius
  				});

  				d3.select("#tooltip").remove();
		    });
	} else {
		animatePoints(enterAttributes, updateAttributes);
	}
}

function handleMouseOver(d, i) { 
	// Use D3 to select element, change color and size
	d3.select(this).attrs({
  		
	});
}

function handleMouseOut(d, i) {
	// Use D3 to select element, change color back to normal
	d3.select(this).attr({
		fill: "black",
		r: radius
	});
}

function animatePoints(enterAttributes, updateAttributes) {
	/*var animate = new Animate(data, timeKey, animationKey);
	var selection = new AnimateSelection("circle", g.selectAll("circle"));
	selection.enterAttrs = enterAttributes;
	selection.updateAttrs = updateAttributes;
	animate.addSelection(selection);
	// The things in here need to be defined in HTML on the page
	animate.addTime("timebox");
	animate.addTimeline("timeline");*/
}

function drawUSOutlines() {
	var us = usPath;

	if (drawCounties) {
	  	g.append("path")
	  		.attr("stroke", countiesStrokeColor)
	      	.attr("stroke-width", countiesStrokeWidth)
	      	.attr('fill', 'none')
	      	.attr("d", path(countyOutlines));
	 } 

	if (drawStates) {
		g.append("path")
			.attr("stroke", statesStrokeColor)
			.attr("stroke-width", statesStrokeWidth)
			.attr('fill', 'none')
		    .attr("d", path(stateOutlines));
	} 
	
	g.append("path")
			.attr("stroke", nationStrokeColor)
		    .attr("stroke-width", nationStrokeWidth)
		    .attr("fill", "none")
		    .attr("d", path(nationOutline));
}

function loadUS(callback) {
	d3.json("https://unpkg.com/us-atlas@1/us/10m.json", function(error, us) {
  		if (error) throw error;
		usPath = us;
		countyOutlines = topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b && (a.id / 1000 | 0) === (b.id / 1000 | 0); });
		stateOutlines = topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; });
		nationOutline = topojson.feature(us, us.objects.nation);
		callback(null);
	});
}

function getAndDrawUSforPoints() {
  	var us = usPath;

  	svg.style("background-color", waterColor);

  	// Fill the nation
  	g.append("path")
	    .attr("fill", landColor)
	    .attr("d", path(nationOutline));

  	drawUSOutlines();
	drawPoints();
}

generate();
