module.exports = {

    foo: {
        type: "function",
        args: ["a", "b"],
        fn: function(args, callback){
            var data = args.a * args.b;
            callback(null, data);
        },
    },


    bar: {
        type: "action",
        args: ["a", "b"],
        fn: function(args, callback){
            var data = args.b / args.a;

            setTimeout(function(){
                callback(null, data);
            }, 1000);
        },
    },

};
