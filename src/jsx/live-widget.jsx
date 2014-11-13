/** @jsx React.DOM */

var DDP = require('ddp'),
    Board = require('./board.jsx'),
    DrawList = require('./drawlist.jsx'),
    GameList = require('./gamelist.jsx'),
    Team = require('./team.jsx');

// <Widget/>

module.exports = function(opts) {
    
    var client = new DDP({
        host:   opts.host || 'scoreix.com',
        port:   opts.port || 80,
        ssl:    window.location.protocol == 'https://' ? true : false
    }),
        
        retryCountdown;
        
        window.cli = client;
    
    return React.createClass({

        getInitialState: function() {
            return {
                connected:  false,

                loadingMsg: 'Connecting...',

                currentDraw: false,
                gameLen: 8,

                teamModal: {},

                static_games: {},
                static_surfaces: {},
                games: {},
                events: {},
                teams:  {},
                standings: {}
            };
        },

        getDefaultProps: function() {
            return {};
        },

        aggStats: function(tStat) {
            var rounds = {},
                noRoundStat = [];
            _.each(tStat, function(stat, key) {
                if(typeof stat === "object")
                    rounds[key] = stat;
                else
                    noRoundStat.push(key);
            });

            var stats = _.pick(tStat, noRoundStat);

            _.each(rounds, function(rStat) {
                stats = _.reduce(rStat, function(memo,val,statKey) {
                    if(!memo[statKey])  memo[statKey] = 0;
                    memo[statKey] += val;
                    return memo;
                }, stats);
            });

            return stats;
        },

        prepStandings: function(teams) {

            if(!teams || !_.isArray(teams) || !teams.length)  return teams;

            var board = {
                scope:  '',
                rank:   ['wlt','alpha'],
                event:  teams[0].event
            };

            var arr = teams.slice(0);
            arr.sort(function(a,b) {
                var round = /round:/.test(board.scope) ?  board.scope.replace('round:','') : false,
                    tA = round ? ((a.stats||{})[round] || {}) : (this.aggStats(a.stats) || {}),
                    tB = round ? ((b.stats||{})[round] || {}) : (this.aggStats(b.stats) || {}),
                    df = 0,
                    sortBy = board.rank.slice(0),
                    ev;

                while(df==0 && sortBy.length>0) {

                    switch(sortBy.shift()) {
                        case "wlt":
                            // OTW and OTL need to count towards base wins and losses
                            tA.w = tA.w || 0;
                            tB.w = tB.w || 0;
                            tA.l = tA.l || 0;
                            tB.l = tB.l || 0;
                            tA.otw = tA.otw || 0;
                            tA.otl = tA.otl || 0;
                            tB.otw = tB.otw || 0;
                            tB.otl = tB.otl || 0;

                            df = -( ((tA.w+tA.otw)*100 + (tA.t||0) + (tA.gp||0)) - ((tB.w+tB.otl)*100 + (tB.t||0) + (tB.gp||0)) );
                            break;

                        case "alpha":
                            df = (a.name||'').localeCompare(b.name||'');
                            break;
                    }

                }

                return df;
            }.bind(this));

            return arr;
        },

        fetchStandings: function() {

            if(!socketChannels['eventWidget_events'].isReady || !socketChannels['eventWidget_teams'].isReady)
                return;

            var standingsState = this.state.standings || {};

            _.each(this.state.static_events, function(ev, i) {
                if(this.hasPoolsOrRounds(ev)) {
                    var stand = _.groupBy(_.flatten(_.map(ev.pools, function(pt,pn) {
                        var poolTeams = _.map(_.pick(this.state.teams, pt), function(t) {
                            return _.extend(t, {pool:pn});
                        });
                        return this.prepStandings(poolTeams);
                    }.bind(this))), 'event');

                    if(!_.isEmpty(stand)) {
                        _.extend(standingsState, stand);
                        this.setState({standings: standingsState});
                    }
                }
                else {
                    var stand = _.groupBy(this.prepStandings(_.filter(this.state.teams, function(t) { return t.event==ev._id; })), 'event');

                    if(!_.isEmpty(stand)) {
                        _.extend(standingsState, stand);
                        this.setState({standings: standingsState});
                    }
                }
            }.bind(this));
        },

        fetchSurfaceNames: function() {

            if(!socketChannels['eventWidget_games'].isReady || !socketChannels['eventWidget_live'].isReady || !socketChannels['eventWidget_surfaces'].isReady)
                return;

            var gameState = this.state.static_games,
                liveState = this.state.games;

            _.each(gameState, function(game, gid) {
                var srf = this.state.static_surfaces[game.surface] || '';
                if(srf && srf.name) {
                    srf=srf.name;
                    _.extend(gameState[gid], {surfaceName:srf});
                    if(liveState[gid])
                        _.extend(liveState[gid], {surfaceName:srf});
                }
            }.bind(this));

            this.setState({static_games: gameState});
            this.setState({games: liveState});
        },

        setDrawTime: function() {

            if(!socketChannels['eventWidget_games'].isReady || !socketChannels['eventWidget_live'].isReady)
                return;            

            var staticGamesAllowed = this.state.static_games,
                liveGamesAllowed = this.state.games,
                games = _.sortBy(_.values(staticGamesAllowed),'time'),
                liveGames = _.sortBy(_.values(liveGamesAllowed),'lastUpdated'),
                staticGames = _.sortBy(_.values(staticGamesAllowed),'lastUpdated'),
                firstGame = _.first(games),
                lastUpdated = _.last(liveGames.length ? liveGames : staticGames),
                currentDraw = lastUpdated ? lastUpdated : (firstGame ? firstGame : false);

            if(firstGame.time > new Date()) currentDraw = firstGame;

            if(DEBUG) console.log(games, liveGames, staticGames, firstGame, lastUpdated, currentDraw);
            
            this.setState({ currentDraw: currentDraw ? currentDraw.time : false });
        },

        subIsReady: function(subs) {
            _.each(subs, function(subId) {
                var sub = _.find(socketChannels, function(cfg) { return cfg.id==subId; }) || {};
                sub.isReady = true;
                switch(sub.collection) {
                    case "static_events":
                        var length = _.max(_.pluck(_.without(_.pluck(client.collections.static_events, 'config'),undefined),'gameLength'), function(c) {
                            return c || 0;
                        });
                        if(length)  this.setState({gameLen:length});
                    case "teams":
                        this.fetchStandings();
                        break;

                    case "static_games":
                        // carries thru all games (live and static to surface naming)...
                    case "games":
                        this.setDrawTime();
                    case "static_surfaces":
                        this.fetchSurfaceNames();
                        break;
                    default:
                        if(DEBUG)   console.log('Unknown collection "'+sub.collection+'"', client.collections);
                }
            }.bind(this));

            if(DEBUG && _.contains(subs,'5'))
                setTimeout(function() {console.log('Ready State', this.state);}.bind(this), 1000);
        },

        componentDidMount: function(el) {
            client.on('socket-error', function(err) {
                if(err.type == "retry") {

                    clearInterval(retryCountdown);

                    var msg = function(timer) { return {loadingMsg: 'Unable to retrieve scores, retrying'+(timer>0 ?' in ' + (timer/1000) + ' second'+ (timer>1000?'s':'') :'') +'.'};};

                    this.setState(msg(err.timer));

                    retryCountdown = setInterval(function() {
                        err.timer -= 1000;
                        this.setState(msg(err.timer));
                    }.bind(this), 1000);
                }
            }.bind(this));

            client.connect(function(error) {
                if(error)
                    return console.log(error);

                this.setState({ connected: true });

                var subCount = 0;
                _.each(socketChannels, function(cfg,channel) {
                    subCount++;
                    socketChannels[channel].id = subCount;
                    client.subscribe(channel, [this.props.events], function() {}.bind(this));
                }.bind(this));

                client.on('message', function(msg) {
                    var msg = EJSON.parse(msg);

                    if(msg.msg=="ready") {
                        this.subIsReady(msg.subs);
                        return;
                    }

                    if(DEBUG) console.log('MESSAGE ',msg);

                    var newState = _.extend({}, this.state[msg.collection]);

                    switch(msg.msg) {
                        case "changed":
                            _.each(msg.fields, function(field,name) {
                                newState[msg.id][name] = field;
                            });
                            if(msg.collection=="games") {
                                var g = document.querySelector('#game_'+msg.id);
                                addClass(g,'live');
                                setTimeout(function() {
                                    if(document.contains(g))
                                        remClass(g,'live');
                                }, 500);
                            }
                            else if(msg.collection=="teams" && "stats" in msg.fields) {
                                this.fetchStandings();
                            }
                            break;
                        case "added":
                            if(["games","static_games"].indexOf(msg.collection)!=-1 && !msg.fields.time)
                                return; // don't add games with no time
                            
                            msg.fields._id = msg.id;
                            newState[msg.id] = msg.fields;
                            break;
                        case "removed":
                            newState = _.omit(newState, msg.id);
                            break;
                    }

                    var stateSet = {};
                    stateSet[msg.collection] = newState;
                    this.setState(stateSet);

                }.bind(this));

                client.on('socket-close', function(status,reason) {
                    console.log(status,reason);
                });

            }.bind(this));

        },

        hasPoolsOrRounds: function(ev) {
            return _.some(ev.pools||[], function(p,rOrP) {
                if(_.isArray(p))    return true;
                else if(_.some(p, function(pp) {
                    return _.isArray(pp);
                })) return true;
                return false;
            });
        },

        drawChanged: function(draw) {
            this.setState({currentDraw:draw.time});
        },

        teamClicked: function(teamId) {
            this.state.teamModal = this.state.teams[teamId] || {};
        },

        render: function() {

            if(this.state.connected)
                clearInterval(retryCountdown);

            var selfi = this,
                loading = (
                <div className="scoreixlive_loading">
                    { this.state.loadingMsg }
                </div>
            );

            var boards = _.map(this.state.static_events, function(ev,i) {

                var evstand = this.state.standings[i],
                    tables = _.map(_.groupBy(_.sortBy(evstand,'pool'), 'pool'), function(teams,poolName) {
                        return <Board key={poolName} name={toTitleCase(poolName)} teams={teams} teamClicked={selfi.teamClicked} max={selfi.props.maxPoolTeams} />
                    });

                return (
                    <div key={i} className="scoreix_live_standings">
                        <h2>{ev.name}</h2>
                        {tables}
                    </div>
                );
            }.bind(this));

            var columns = (
                <div className="scoreix_live-g-r">
                    <div className="scoreix_live-u-3-4">
                        <DrawList id="drawlinks" games={this.state.static_games} forceType={this.props.forceType} events={this.state.static_events} drawChanged={this.drawChanged} currentDraw={this.state.currentDraw} draws={this.props.draws} />
                        <Team team={this.state.teamModal} events={this.state.static_events} />
                        <GameList games={this.state.static_games} livegames={this.state.games} length={this.state.gameLen} teams={this.state.teams} surfaces={this.state.static_surfaces} currentDraw={this.state.currentDraw} forceType={this.props.forceType} sortBy={this.props.sortGamesBy} />
                        <div className="sixnote">
                            <p>Powered by <a href="http://scoreix.com">ScoreiX Live</a> so you don't have to refresh your browser.</p>
                        </div>
                    </div>
                    <div className="scoreix_live-u-1-4 scoreix_live_boards">
                        <TransGroup transitionName="boards">
                            <h1>Standings</h1>
                            {boards} 
                        </TransGroup>
                    </div>
                </div>
            );

            return (
                <div id="scoreixlive_container">
                    { this.state.connected ? columns : loading }
                </div>
            );
        }
    });
    
};