/** @jsx React.DOM */

var check;

module.exports = React.createClass({
    
    getDefaultProps: function() {
        return {
            events: {},
            games:  {},
            drawChanged: function() {},
            currentDraw: false,
            draws: {}
        };
    },
    
    getDraws: function() {
        var forceType = _.isArray(this.props.forceType) && this.props.forceType.length ? this.props.forceType : false,
        allowed = function(g) { 
            var scoreType = g.scoreType || getOrFalse(this.props.events, [ g.event, 'config', 'gameFormat' ].join('.')) || 'linescore';
            return !forceType || (forceType && forceType.indexOf(scoreType)!=-1);
        }.bind(this);

        return _.sortBy(_.without(_.map(_.groupBy(_.filter(this.props.games, allowed), 'time'), function(games) {
            if(games.length)
                return {
                    time:   games[0].time
                };
        }),undefined), 'time');
    },
    
    render: function() {

        var drawLabels = this.props.draws || {},
            list = _.without(_.map(this.getDraws(), function(draw,i) {
            if(!draw.time || !this.props.currentDraw)
                return;
            var active = this.props.currentDraw.valueOf() == draw.time.valueOf() ? 'active' : '',
                label = drawLabels[draw.time.valueOf()] || 'Draw '+(i+1);

            return <li key={i}><a href="#drawlinks" className={active} onClick={this.props.drawChanged.bind(null,draw)}>{label}</a></li>
        }.bind(this)), undefined);
                
        return (
            <ul className="scoreix_live_drawlist">
                {list}
            </ul>
        );
    }
    
});