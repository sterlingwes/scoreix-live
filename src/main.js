require('./css/grid.less');
require('./css/sixwidget.less');

require('script!shims/console');
require('script!shims/es5-shim');
require('script!shims/es5-sham');
require('expose?React!react');
require('script!./globals');
require('expose?_!underscore');
require('expose?EJSON!meteor-ejson');

ScoreiX = {
    
    /*
     * start()
     * 
     * initializes the DPP connection and renders the widget
     * 
     * options:
     * 
     * - events (array) event ids
     * - forceType (array) only accept scoreboards of this score type
     * - draws (object) replace draw labels if string value provided for date value (valueOf())
     * - maxPoolTeams (number) point at which standings boards are truncated
     */
    start: function setup(opts) {
        
        if(typeof opts !== "object")
            opts = {};

        if(!opts.events || !opts.events.length) {
            throw new Error('ScoreiX: No events specified. Please provide an array of event IDs to fetch games for.');
            return;
        }

        var Widget = require('./jsx/live-widget.jsx')(opts);

        React.renderComponent(
            Widget(opts), document.querySelector('#scoreixlive')
        );
        
    }
    
};