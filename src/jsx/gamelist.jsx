/** @jsx React.DOM */

var Game = require('./game.jsx');

module.exports = React.createClass({
    
    getDefaultProps: function() {
        return {
            games:  {},
            livegames: {},
            currentDraw: false,
            teams: {},
            surfaces: {},
            forceType: false
        };
    },
    
    getSortedGames: function() {
        var forceType = _.isArray(this.props.forceType) && this.props.forceType.length ? this.props.forceType : false,
            sortBy = this.props.sortBy || 'surfaceName';
        var games = _.filter(this.props.games, function(game) {
            if(!game.time || !this.props.currentDraw || (game.scoreType && forceType && forceType.indexOf(game.scoreType)==-1))  return;
            return game.time.valueOf() == this.props.currentDraw.valueOf() && game.teams && game.teams.length>=2;
        }.bind(this));
        
        games = _.sortBy(games, sortBy);
        
        return games;
    },
    
    render: function() {
        
        if(this.props.currentDraw) {

            var games = _.map(this.getSortedGames(), function(game,gi) {
                var liveGame;
                if(this.props.livegames && this.props.livegames[game._id]) {
                    liveGame = this.props.livegames[game._id];
                }
                
                return <Game key={game._id} deflen={this.props.length} game={liveGame||game} isLive={!!liveGame} teams={this.props.teams} />
            }.bind(this));
                
            if(!games.length)
                return <p><b>There are not currently any games enabled for live scoring. Please check back later.</b></p>
            
            var time = this.props.currentDraw,
                day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][time.getDay()],
                month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][time.getMonth()],
                hours24 = time.getHours(),
                hours = hours24 > 12 ? hours24 - 12 : (hours24==0 ? 12 : hours24),
                minutes = time.getMinutes().toString(),
                date = time.getDate(),
                clock = minutes.length < 2 ? hours+':0'+minutes : hours+':'+minutes,
                ampm = hours24 < 12 ? 'AM' : 'PM',
                draw = this.props.currentDraw ? <h3>{day}, {month}. {date} at {clock}{ampm}</h3> : '';
                
            return <TransGroup transitionName="gamelist" className="scoreix_live_gamelist">{draw}{games}</TransGroup>;
        }
        
        return <p></p>;
        
    }
    
});