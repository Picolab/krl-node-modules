var _ = require("lodash");
var readPkgUp = require("read-pkg-up");

var getConfFromPackageJson = function(callback){
    readPkgUp().then(function(data){
        process.nextTick(function(){
            callback(null, _.get(data, ["pkg", "pico-engine"], {}));
        });
    }, function(err){
        callback(err);
    });
};

getConfFromPackageJson(function(err, pconf){
    if(err) throw err;

    var conf = {};

    conf.port = _.isFinite(pconf.port)
        ? pconf.port
        : process.env.PORT || 8080
        ;

    conf.host = _.isString(pconf.host)
        ? pconf.host
        : process.env.PICO_ENGINE_HOST || null
        ;
    if( ! _.isString(conf.host)){
        conf.host = "http://localhost:" + conf.port;
    }

    conf.pico_engine_home = _.isString(pconf.home)
        ? pconf.home
        : process.env.PICO_ENGINE_HOME || null
        ;
    if( ! _.isString(conf.pico_engine_home)){
        conf.pico_engine_home = require("home-dir")(".pico-engine");
    }

    conf.modules = {};
    _.each(pconf.modules, function(path, id){
        conf.modules[id] = require(path);
    });

    console.log(conf);
});
