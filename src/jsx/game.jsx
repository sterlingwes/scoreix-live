/** @jsx React.DOM */

var HAMMERICON = require('../img/hammer.png');

module.exports = React.createClass({
    
    getDefaultProps: function() {
        return {
            game: false,
            teams:  []
        };
    },
    
    line: function(team,gameLen,total,isSkins) {
        
        return _.map(_.range(gameLen+1), function(i,ii) {
            
            if(ii==gameLen) {
                if(isSkins)
                    return <td key={ii} className="endWide">{total}</td>;
                    
                return <td key={ii} className="end">{total}</td>;
            }
            
            if(!this.props.game.scores || !this.props.game.scores[team]) {
                return <td key={ii} />;
            }
            
            var pts = this.props.game.scores[team][i];
            
            if(isSkins && _.isNumber(pts) && pts>0)
                return <td key={ii} className="end">$</td>;
            else if(isSkins && _.isNumber(pts))
                return <td key={ii} className="end" style={{color:'#888'}}>-</td>;
            
            return <td key={ii} className="end">{pts}</td>;
        }.bind(this));
        
    },
    
    teamname: function(id) {
        return this.props.teams && this.props.teams[id] ? this.props.teams[id].name : id;
    },
    
    gamenotes: function(cols,game) {        
        var note = game.surfaceName || ''
          , now = 'now' in Date && Date.now();
        
        if(now && game.lastUpdated instanceof Date && now.valueOf() - game.lastUpdated.valueOf() < 30*1000*60) {
            var mins = game.lastUpdated.getMinutes().toString();
            if(mins.length<2) mins = '0'+mins;
            note += ' - Last Updated at '+ game.lastUpdated.getHours() + ':' + mins;
        }
        
        return (
            <tr>
                <td className="notes" colSpan={cols}>{note}</td>
            </tr>
        );
    },
    
    render: function() {
        
        var game = this.props.game || {};
        
        var gameLen = game.scores ? game.scores[0].length : this.props.deflen,
            totala = 0,
            totalb = 0,
            hammera = '',
            hammerb = '';
        
        if(game.scores) {
            totala = _.reduce(game.scores[0], function(memo, num) {
                if(!num || !_.isNumber(num))    return memo;
                return memo + num;
            }, 0);
            totalb = _.reduce(game.scores[1], function(memo,num) {
                if(!num || !_.isNumber(num))    return memo;
                return memo + num;
            }, 0);
            
            if(!game.scoreType=="skins" && _.last(game.scores[0]) && _.last(game.scores[1]) && totala && totala==totalb)
                gameLen++;
        }
        
        if(game.scoreMeta && game.scoreMeta.hammer) {
            var hammer = <img src={HAMMERICON} />;
            hammera = game.scoreMeta.hammer=='a' ? hammer : '';
            hammerb = game.scoreMeta.hammer=='b' ? hammer : '';
        }
        
        var ends = _.map(_.range(gameLen), function(i,ii) {
                return <th key={ii} className="end">{i+1}</th>;
            }),
            
            cols = ends.length + 3,
            
            id = 'game_'+game._id,
            
            totalClass = game.scoreType == "skins" ? "endWide" : "end";
        
        return (
            <table id={id}>
                <thead>
                    <th className="left">{game.notes || ''}</th>
                    <th className="end hammer"><img src={HAMMERICON} /></th>
                    { ends }
                    <th className={ totalClass }>T</th>
                </thead>
                <tbody>
                    <tr>
                        <td>{this.teamname(game.teams[0].id)}</td>
                        <td className="hammer">{hammera}</td>
                        {this.line(0,gameLen,totala,game.scoreType=='skins')}
                    </tr>
                    <tr>
                        <td>{this.teamname(game.teams[1].id)}</td>
                        <td className="hammer">{hammerb}</td>
                        {this.line(1,gameLen,totalb,game.scoreType=='skins')}
                    </tr>
                    {this.gamenotes(cols,game)}
                </tbody>
            </table>
        );
        
    }
    
});