// Customizable variables

// Key variables
var animationKey;
var timeKey = "Year founded";
var latColKey = "Latitude";
var longColKey = "Longitude";
var pointColorKey = "Order ID";
var scaleFactor = 1;

//animation variables
var animateIt = false;

// zoom scales
var minZoomScale = 1;
var maxZoomScale = 70;

// Map strokes
var countiesStrokeWidth = 0.2;
var countiesStrokeColor = "#ffffff";
var statesStrokeWidth = 1;
var statesStrokeColor = "#ffffff";
var nationStrokeWidth = .05;
var nationStrokeColor = "#ffffff";

var landColor = "#dddddd";
var waterColor = "#f4f7ff";

var drawCounties = true;
var drawStates = true;

// Point vars
var radius = 20;
var minRadius = 1;
var pointOutlineColor = "#000000";
var pointOutlineWidth = .5;
var minPointOutlineWidth = .03;
var pointOpacity = .8;

var width = 960;
var height = 600;
var svg = d3.select("#svg")
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
var zoom;
var orders;
var oldiconid = null;
var oldiconyear = null;

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
	d3.csv("/data/schools.csv", function(d) { 
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

function loadOrders(callback) {   
	d3.csv("/data/orders.csv", function(d) { 
		orders = d;
		callback(null);
	});
}

function makeVisualizations() { 
	zoom = d3.zoom().scaleExtent([minZoomScale, maxZoomScale])
		.on("zoom", zoomIn);
	svg.call(zoom)
		.on("wheel.zoom", null);

	if (data == null) {
		d3.queue()
			.defer(loadData)
			.defer(loadOrders)
		.await(getAndDrawUSforPoints)
	} else {
		getAndDrawUSforPoints();
	}
}

function zoomIn() {
	g.attr("transform", d3.event.transform);
	scaleFactor = d3.event.transform.k;
	/*g.selectAll("circle")
		.attr('r', radiusFunction);*/
	g.selectAll("text")
		.attr('font-size', radiusFunction)
		.attr('stroke-width', outlineFunction);
	if (oldiconid == null || oldiconyear > +d3.select('#year').text()) return;
	d3.select("#id" + oldiconid).attrs({
		'stroke-width': function(d) {
			return outlineFunction(d) * 1.5;
		},
		'font-size': function(d) {
			return radiusFunction(d) * 1.5;
		},
		stroke: "red",
		opacity: 1,
	});
}


var radiusFunction = function(d) {
	if (scaleFactor < 1.4) return radius;
	var r = radius/(scaleFactor * 0.7);
	if (r < minRadius) r = minRadius;
	return r;
};

var outlineFunction = function(d) {
	if (scaleFactor < 1.4) return pointOutlineWidth;
	var o = pointOutlineWidth/(scaleFactor * 0.7);
	if (o < minPointOutlineWidth) o = minPointOutlineWidth;
	return o;
};

function selecticon(icon, data, i) {
	if (data["School ID"] == oldiconid) return;
	d3.select(("#id" + data["School ID"])).attrs({
		'stroke-width': function(d) {
			return outlineFunction(d) * 1.5;
		},
		'font-size': function(d) {
			return radiusFunction(d) * 1.5;
		},
		stroke: "red",
		opacity: 1,
	});

	if (oldiconid != null && oldiconyear <= +d3.select('#year').text()) {
		d3.select("#id" + oldiconid).attrs({
			//fill: fillfunction,
			'stroke-width': outlineFunction,
			'font-size': radiusFunction,
			stroke: pointOutlineColor,
			opacity: pointOpacity,
		});
	}
	oldiconid = data["School ID"];
	oldiconyear = data["Year founded"];

	seticontext(data, i);
}

function seticontext(d, i) {
	d3.select('#maptitle').text(d["School name"]);
	var map = d3.select('#mapinfo');
	map.html("");


	if (d["Founder/Foundress"] != "") 
		map.append('p')
			.text(d["Location"])
			.append('p')
			.text(d["Order Name"])
			.append('p')
			.text("Foundress: " + d["Founder/Foundress"])
			.append('p')
			.text("Type: " + d["Type of students taught"]);
	else map.append('p')
		.text(d["Location"])
		.append('p')
		.text(d["Order Name"])
		.append('p')
		.text("Type: " + d["Type of students taught"]);

	map.append('p')
		.text("Date school founded: " + d["Date school founded"])
		.append('p')
		.text("Date school closed: " + d["Year school ended [if applicable]"]);

	map.append('p')
		.text(d["School description"])

	map.append('p')
		.text("Sources: " + d["Sources"]);

	var o = orders[d["Order ID"]-1];

	map.append('h5')
		.text("About the " + o["Order name"]);

	map.append('p')
		.text("Date order founded: " + o["Date order founded"])
		.append('p')
		.text("Location of founding: " + o["Location"])
		.append('p')
		.text("Foundress: " + o["Order founder"]);

	map.append('p')
		.text(o["Description of order"]);

	map.append('p')
		.text("Sources: " + o["Website/Sources"]);
}

var textAttributes;
function drawPoints() {
	var colorRange = d3.scaleOrdinal()
		.domain([1,6,2,3,4,5])//d3.map(data, function(d) {return (d[pointColorKey])}).keys()) // this may be wrong
		.range(d3.schemeSet1); //if more, do schemeCategory20

	var fillfunction = function (d) { return colorRange(d[pointColorKey]); };

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
		"stroke-width": outlineFunction,
		stroke: pointOutlineColor,
		r: radiusFunction,
		fill: fillfunction,
	}

	textAttributes = {
		x: function (d) { 
			var coords = [d[longColKey], d[latColKey]];
			return projection(coords)[0]; 
		},
		y: function (d) { 
			var coords = [d[longColKey], d[latColKey]];
			return projection(coords)[1];  
		},
		opacity: pointOpacity,
		"stroke-width": outlineFunction,
		stroke: pointOutlineColor,
		fill: fillfunction,
		'font-family': 'FontAwesome',
		'font-size': radiusFunction,
		id: function(d) {
			return "id" + d["School ID"];
		}
	}

	var updateAttributes = {};

	g.selectAll("text")
		.data(data)
		.enter()
		.append('text')
			.attrs(textAttributes)
	    	.text(function(d) { return '\uf276' })
	    .on("mouseover", function(d, i) {
	    	if (d["School ID"] == oldiconid) return;
		    	d3.select(this).attrs({
  					'font-size': function(d) {
  						return radiusFunction(d) * 1.5;
  					}
  				});

		    })
        .on("mouseout", function(d, i) {
        	if (d["School ID"] == oldiconid) return;
	    	d3.select(this).attrs({
					'font-size': radiusFunction,
				});
	    })
	    .on("mousedown", function(d, i) {
	    	selecticon(this, d, i);
			});

	if (false){//!animateIt) {
		g.selectAll("circle")
		    .data(data)
		    .enter()
		    .append("circle")
		    .attrs(enterAttributes)
		    .attrs(updateAttributes)
		    .on("mouseover", function(d, i) {
		    	d3.select(this).attrs({
		    		//fill: "orange",
  					r: function(d) {
  						return radiusFunction(d) * 1.5;
  					}
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
                    //.text(d["Order Name"] + ", " + d['Location']);
		    })
            .on("mouseout", function(d, i) {
		    	d3.select(this).attrs({
		    		//fill: fillfunction,
  					r: radiusFunction,
  				});

  				d3.select("#tooltip").remove();
		    });
	} else if (false) {
		animatePoints(enterAttributes, updateAttributes);
	}
}

//TIMELINE
d3.select("#timeline")
    .on("input", timeline);

function timeline() {
	var val = this.value;

	var selection = g.selectAll("text")
		.data(data.filter(function(d) {
	      	return d['Year founded'] <= val;
	    }), function(d) {return d["School ID"]});

	selection.enter()
		.append('text')
			.attrs(textAttributes)
	    	.text(function(d) { return '\uf276' })
	    .on("mouseover", function(d, i) {
	    	if (d["School ID"] == oldiconid) return;
		    	d3.select(this).attrs({
		    		opacity: .9,
  					'font-size': function(d) {
  						return radiusFunction(d) * 1.5;
  					}
  				});

		    })
        .on("mouseout", function(d, i) {
        	if (d["School ID"] == oldiconid) return;
	    	d3.select(this).attrs({
					'font-size': radiusFunction,
					opacity: pointOpacity,
				});
	    })
	    .on("mousedown", function(d, i) {
	    	selecticon(this, d, i);
			});

	selection.exit().remove();

	d3.select('#year').text(val);

	if (oldiconid == null || oldiconyear > val) return;
	d3.select("#id" + oldiconid).attrs({
		'stroke-width': function(d) {
			return outlineFunction(d) * 1.5;
		},
		'font-size': function(d) {
			return radiusFunction(d) * 1.5;
		},
		stroke: "red",
		opacity: 1,
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


// Add zoom
d3.select('#zoom_in').on('click', function() {
	zoom.scaleBy(svg, 1.5);
});

d3.select('#zoom_out').on('click', function() {
	zoom.scaleBy(svg, 0.66);
});

generate();
