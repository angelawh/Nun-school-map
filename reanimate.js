// Requirements: JQuery, that other package

// Non-integral time and dealing with more time formats
// Throwing good errors
// Delay needs to actually be a function of change which may be impossible
var INT_TIME = 'INT_TIME';

class Animate {
	constructor(data, timeIndex, keyIndex, timeParser = null) {
		this.selectionStr = "";  // A string
		this.data = data; // Make a copy?
		this.timeIndex = timeIndex; // Either an int or a String
		this.keyIndex = keyIndex;  // Either an int or a String
		// Converts a time String (or whatever) into a date number
		// or basically any integer that has relative integer values
		this.timeParser = timeParser;
		if (this.timeParser == null) {
			this.timeParser = function (time) {return time;} 
		}
		this.timeList = this.setUpTime();
		this.selections = [];
    // Both must be objects {'duration': 0, 'delay':0}
		this.transition = null;
		this.exitTransition = null;
    this.timeId = null;
    this.timeFormat = null;
	}

  addTimeFormat(funciton) {
    this.timeFormat = funciton;
  }

  addTime(timeId) {
    this.timeId = timeId;
  }

  addTransition(duration, delay = 0) {
    this.transition = {'duration': duration, 'delay': delay};
  }

  addExitTransition(duration, delay = 0) {
    this.exitTransition = {'duration': duration, 'delay': delay};
  }

  	setUpTime() {
  		for (var i = 0; i < this.data.length; i++) {
  			this.data[i][INT_TIME] = this.timeParser(this.data[i][this.timeIndex]);
  		}
        var list = [];
        for (var i = 0; i < this.data.length; i++) {
          if ($.inArray(this.data[i][INT_TIME], list) == -1) {
            list.push(this.data[i][INT_TIME]);
          }
        }
        list.sort(function(a, b) {
	        return a - b;
	      });
        return list;
     }

     addSelection(animateSelection) {
     	// CHECK THAT THE DATA IS OK
     	this.selections.push(animateSelection);
      if (this.selection == null) {
        this.selection = svg.selectAll(animateSelection.type);
      }
     }

     addInitialSelection(selection) {
     	this.selection = selection;
     }


     // For any of the following functions, there must be at least one AnimateSeleciton
     // this.selections.length() < 1
    animate(intervalLen = 100) { // selection, data, timeIndex, keyIndex, attributeList, transition) { 
  		// Throw error if this.selections.length() < 1
      if (this.selections.length >= 1)
  		  animating(this, intervalLen, true);
    }

    loop(intervalLen = 100) {
      // Throw error if this.selections.length() < 1
      if (this.selections.length >= 1)
        animating(this, intervalLen, false);
    }

    
  addTransitionButtons(startElementId, pauseElementId, resetElementId, intervalLen = 100) {
    addTransitionButtons(this, startElementId, pauseElementId, resetElementId, intervalLen);  
  } 
  
  addTransitionByClick(elementName, intervalLen = 100) {
    addTransitionStopStart(this, elementName, intervalLen);
  } 

  addTimeline(elementId, transitionSpeed = 1) {
    addTimeline(this, elementId, transitionSpeed);
  }  
}

function addTimeline(animate, elementId, transitionSpeed) {
  $('#' + elementId).attr({
    "min": 0,
    "max": animate.timeList.length - 1,
    "step": 1,
  });

  mainTransition(animate, 0, transitionSpeed);

  d3.select("#" + elementId).on("input", function() {
    mainTransition(animate, this.value, transitionSpeed);
  });
}

function addTransitionButtons(animate, startElementId, pauseElementId, resetElementId, intervalLen) {
  var i = 0;
  var t = null;
  var transitioning = false;
  d3.select('#' + startElementId).on("click", function() { 
    if (!transitioning) {
      transitioning = true;
        t = d3.interval(function() {
          mainTransition(animate, i, intervalLen);
          i++;
          if (i >= animate.timeList.length) {
              i = 0;
              mainTransition(animate, 0, 0);
          }
        }, intervalLen);
      }
    });
  d3.select('#' + resetElementId).on("click", function() {
    t.stop(); 
    transitioning = false;
    mainTransition(animate, 0, intervalLen); 
    i = 0;
  });
  d3.select('#' + pauseElementId).on("click", function() {
    t.stop(); 
    transitioning = false;
  });
}

function addTransitionStopStart(animate, elementName, intervalLen) {
  var i = 0;
  var t = null;
  var transitioning = false;
  d3.select(elementName).on("click", function() { 
    if (!transitioning) {
      transitioning = true;
        t = d3.interval(function() {
          mainTransition(animate, i, intervalLen);
          i++;
          if (i >= animate.timeList.length) {
              i = 0;
              mainTransition(animate, 0, 0);
          }
        }, intervalLen);
    } else {
      t.stop(); 
      transitioning = false;
    }
  });
}

   // For any of the following functions, there must be at least one AnimateSeleciton
   // this.selections.length() < 1
function animating(animate, intervalLen, stop) { // selection, data, timeIndex, keyIndex, attributeList, transition) {
        
  // Throw error if this.selections.length() < 1

  // probably do a check to make sure params are AnimateParams
  // Check data for max timeIndex
  //var intervalLen = 100; // how often to call the interval
  var i = 0; 

  var timeList = animate.timeList;

  var t = d3.interval(function() {
    mainTransition(animate, i, intervalLen);
    i++;
    if (i >= timeList.length) {
      if (stop == true) {
         t.stop(); 
      } else {
        i = 0;
        mainTransition(animate, 0, 0);
      }
    }
  }, intervalLen);
}

function mainTransition(animate, i, duration = 300) {
  for (var select = 0; select < animate.selections.length; select++) {
    var params = animate.selections[select];

    // Join new data
    var timeVal = "";
    params.selection = params.selection.data(animate.data.filter(function(d){
      return d[INT_TIME] == animate.timeList[i];
    } ), function(d) {
      timeVal = d[animate.timeIndex];
      return d[animate.keyIndex];
    });
    //console.log(i);
    if (animate.timeId != null) {
      if (animate.timeFormat != null) {
        timeVal = animate.timeFormat(timeVal);
      }
      $('#' + animate.timeId).text(timeVal);
    }

    // Exit old data that doesn't match
    if (animate.exitTransition != null) {
      var exitTrans = d3.transition()
        .duration(animate.exitTransition['duration'])
        .delay(animate.exitTransition['delay']);
      params.selection.exit()
               .transition(exitTrans) // Either null or customized
                  .styles(params.exitStyles)
                  .attrs(params.exitAttrs)
                  .text(params.exitText)
                  .remove();
     } else {
       params.selection.exit().remove();
     }

    // Bind new data
      var enter = params.selection.enter().append(params.type)
              .attrs(params.enterAttrs)
              .styles(params.enterStyles)
              .text(params.enterText)
              .attrs(params.updateAttrs)
              .styles(params.updateStyles)
              .text(params.updateText);


    var updateTrans = d3.transition().duration(duration).delay(0);
    if (animate.transition != null) {
      updateTrans = d3.transition()
        .duration(animate.transition['duration'])
        .delay(animate.transition['delay']);
    }

    params.selection.transition(updateTrans)
              .attrs(params.updateAttrs)
              .styles(params.updateStyles)
              .text(params.updateText)
              .on("end", function() {
                lastTransitionEnded = true;
              });

    params.selection = params.selection.merge(enter);

    for (var i = 0; i < params.callForEach.length; i++) {
      params.callForEach[i].call(params);
    } 
  }
}

function callbackTester (callback) {
   callback();
}

function mmddyyyyParser(dateString) {
	var split = dateString.split("/");
	var date = new Date(Date.UTC(split[2], split[0] - 1, split[1], 0, 0, 0, 0));
	return date.value();
}

class AnimateSelection {
	constructor(type, selection = null) {
		this.type = type;
    this.selection = selection;
    if (this.selection == null) this.selection = svg.selectAll(type);
		// Enter
    this.enterAttrs = null;
    this.enterStyles = null;
    this.enterText = null;

    // Exit
    this.exitAttrs = null;
    this.exitStyles = null;
    this.exitText = null;

    // Update
    this.updateAttrs = null;
    this.updateStyles = null;
    this.updateText = null;

    this.callForEach = [];
	}

  addForEachFunction(func) {
    this.callForEach.push(func);
  }
} 

