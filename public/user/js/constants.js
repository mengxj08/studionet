var GRAPH_CONTAINER = document.getElementById('cy');

var BROADCAST_FILTER_ACTIVE = "filter-started";
var BROADCAST_CLEAR_FILTER = "filter-cleared";
var BROADCAST_CLEAR_ALL_FILTERS = "filter-clear-all";
var BROADCAST_CONTRIBUTION_CLICKED = "contribution-clicked";
var BROADCAST_VIEWMODE_OFF = "contribution-viewer-closed";

var BROADCAST_MESSAGE = "message-sent";

var STUDIONET = {};
STUDIONET.GRAPH = {};

// Spinner
STUDIONET.GRAPH.spinner = {
    lines: 13 // The number of lines to draw
  , length: 28 // The length of each line
  , width: 2 // The line thickness
  , radius: 42 // The radius of the inner circle
  , scale: 1 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#fff' // #rgb or #rrggbb or array of colors
  , opacity: 0.1 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '50%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
}

/*
 * qTip format for hover functions
 *
 */
STUDIONET.GRAPH.qtipFormat = function(evt){
  return {
     content: { title: "", text:"", button: 'Close'  },
     show: {
        evt: evt.type,
        ready: true,
        solo: true
     },
     hide: {
        evt: 'mouseout'
     },
     position: {
        //container: $('div.graph-container'),
        my: 'bottom center',
        at: 'top center'
     },
     events: {
                    //this hide event will remove the qtip element from body and all assiciated events, leaving no dirt behind.
                    hide: function(event, api) {
                        api.destroy(true); // Destroy it immediately
                    }
     },
     style: {
        classes: 'qTipClass',
        width: 300 // Overrides width set by CSS (but no max-width!)
     }
  }
}

// -------------- Helper Functions
Array.prototype.hash = function(){
  
  var hash = [];

  this.map(function(a){
    hash[a.id] = a;
  })
  
  return hash;

}

// remove from ContributionCtrl
var tagCorrectionFn = function(data){
  if( data.tags == null )
    data.tags = [];
  
  if(data.tags != null && data.tags.length == 1 && data.tags[0] == "")
    data.tags = [];

  return data;
}
