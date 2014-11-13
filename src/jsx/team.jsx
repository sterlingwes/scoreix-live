/** @jsx React.DOM */

module.exports = React.createClass({
    
    getDefaultProps: function() {
        return {
            team:   {},
            events: {}
        };
    },
    
    render: function() {
        
        if(!this.props.team || !this.props.team.name)
            return <span/>;
            
        
        var positions = this.props.team.players.slice(0),
            posList = _.uniq(_.flatten(_.map(this.props.events, function(ev) {
                return ev ? ev.positions : [];
            })));
        
        positions.sort(function(a,b) {
            var a = posList.indexOf(a.position),
                b = posList.indexOf(b.position);
            
            return -(a-b);
        });
        
        var players = positions.map(function(player) {
            return <tr><td>{player.position}</td><td>{player.name}</td></tr>;
        });
        
        return (
            <div className="scoreix_live_team">
                <h3>{ this.props.team.name }</h3>
                <table>
                    <tbody>
                        { players }
                    </tbody>
                </table>
            </div>
        );
    }
    
});