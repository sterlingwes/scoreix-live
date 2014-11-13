var socketChannels = {
    'eventWidget_events':   {
        collection: 'static_events'
    },
    'eventWidget_teams':    {
        collection: 'teams'
    },
    'eventWidget_games':    {
        collection: 'static_games',
        sortOrder:  ['time','surface']
    },
    'eventWidget_live':     {
        collection: 'games',
        sortOrder:  ['time','surface']
    },
    'eventWidget_surfaces': {
        collection: 'static_surfaces'
    }
},
    
    addClass = function(el,className) {
        if(el && el.length)
            return _.each(el, function(ell) {
                addClass(ell, className);
            });
        
        if(el.classList)
            el.classList.add(className);
        else
            el.className += ' ' + className;
    },
    
    remClass = function(el,className) {
        if(el && el.length)
            return _.each(el, function(ell) {
                remClass(ell, className);
            });
        
        if(el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^| )' + className.split(' ').join('|') + '( |$)', 'gi'), ' ');
    },
    
    TransGroup = React.addons.TransitionGroup,
    
    DEBUG = false;

function toTitleCase(str) {
    if(!str || str=='undefined')    return '';
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function loadcss(filename){
    var fileref=document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)
    
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function getOrFalse(obj, dots) {
  var path = dots.split('.'),
      val = obj;

  do {
    var segment = path.shift();
    val = obj[segment];

    if(!val) return false;
  } while(path.length>-1);
  
  return val;
}