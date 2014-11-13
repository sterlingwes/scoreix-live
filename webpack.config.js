module.exports = {
    cache:  true,
    entry:  './src/main.js',
    output: {
        path: __dirname + '/build',
        filename: 'scoreix-live.min.js'
    },
    module: {            
        loaders: [
            { test: /\.less$/, loader: 'style!css!less' },
            { test: /\.jsx$/, loader: 'jsx' },
            { test: /\.png$/, loader: 'url?limit=10000&mimetype=image/png' }
        ]
    },
    resolve: {
        modulesDirectories: ['bower_components', 'web_modules', 'node_modules']
    }
};