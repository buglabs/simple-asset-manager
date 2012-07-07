var uglify = require('uglify-js');
var fs = require('fs');
var path = require('path');

//Utility functions
function copy(src, dst) {
    if (!fs.existsSync(src)) {
        throw new Error(src + ' does not exists. Nothing to be copied');
    }

    if (fs.statSync(src).isDirectory()) {
        throw new Error(src + ' is a directory. It must be a file');
    }

    if (src == dst) {
        throw new Error(src + ' and ' + dst + 'are identical');
    }

    var infd = fs.openSync(src, 'r');
    var size = fs.fstatSync(infd).size;
    var outfd = fs.openSync(dst, 'w');

    fs.sendfileSync(outfd, infd, 0, size);

    fs.closeSync(infd);
    fs.closeSync(outfd);
}

function combine(config) {
    var combinedData = '';
    var files = config.files;
    var srcpath = config.src_path;

    var len = files.length;
    for (var i = 0; i < len; i++) {
        combinedData += '\n';
        combinedData += fs.readFileSync(srcpath + files[i]);
    }

    return combinedData;
}

function minimize(code) {
    var ast = uglify.parser.parse(code);
    ast = uglify.uglify.ast_mangle(ast);
    ast = uglify.uglify.ast_squeeze(ast);

    code = uglify.uglify.gen_code(ast, {ascii_only: true});

    return code;
}


module.exports = function(config, assets) {
    if (!config) {
        throw new Error('A configuration object is required.');
    }

    if (!config.base_srcpath) {
        throw new Error('base_srcpath configuration property has to be set.');
    }

    if (!config.base_dstpath) {
        throw new Error('base_dstpath configuration property has to be set.');
    }

    Object.keys(assets).forEach(function(key) {
        var group = assets[key];

        var data = combine({
            files: group.files,
            src_path: config.base_srcpath
        });

        var dstfile = config.base_dstpath +
                      group.dst_path + '/' +
                      key;

        fs.writeFileSync(dstfile + '.js', data);

        var datamin = minimize(data);
        fs.writeFileSync(dstfile + '.min.js', datamin);
    });
};
