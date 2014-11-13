/** @jsx React.DOM */

// standings board

module.exports = React.createClass({
    
    getDefaultProps: function() {
        return {
            name:       '',
            columns:    ['w','l'],
            teams:      {},
            max:        false
        };
    },
    
    showMore: function() {
        remClass(document.querySelectorAll('.belowFold'), 'belowFold');
        addClass(document.querySelectorAll('.loadMore'), 'hide');
    },
    
    render: function() {
        
        var teamArray = this.props.teams.slice(0),
            max = this.props.max ? this.props.max : teamArray.length + 1;
        
        var columns = this.props.columns.map(function(col,i) {
                col = col.toUpperCase();
                return <th key={i} className="end">{ col }</th>;
            }),
            
            teams = teamArray.map(function(team,i) {
                
                var teamStats = this.props.columns.map(function(col,i) {
                    col = col.toLowerCase();
                    return <td key={i} className="end">{ team.stats ? team.stats[col] : 0 }</td>;
                }),
                    classN = i > max ? 'boardTeam belowFold' : 'boardTeam';
                
                //var teamName = team.players && team.players.length ? <a href="#" onClick={this.props.teamClicked}>{team.name}</a> : team.name || '';
                
                var teamName = team.name || '';
                
                return (
                    <tr key={i} className={classN}>
                        <td>{ teamName }</td>
                        { teamStats }
                    </tr>
                );
            }.bind(this));
        
        var loadMore = this.props.max ? <tr><td colSpan={columns.length+1} className="loadMore" onClick={this.showMore}>Top {max}, Show More?</td></tr> : false;
        
        return (
            <div className="scoreix_live_board">
                <table>
                    <thead>
                        <th className="left">{ this.props.name }</th>
                        { columns }
                    </thead>
                    <tbody>
                        { teams }
                        { loadMore || '' }
                    </tbody>
                </table>
            </div>
        );
    }
    
});