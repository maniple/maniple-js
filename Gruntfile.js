module.exports = function(grunt) {

    var path = require('path');
    var findup = require('findup-sync');

    var distdirPath = findup('maniple-js.distdir');

    var files = {};

    var DISTDIR;

    if (distdirPath) {
        // read path to DISTDIR from .distdir file
        // if path is relative, resolve it relatively to .distdir file
        DISTDIR = grunt.file.read(distdirPath).trim();
        if (!grunt.file.isPathAbsolute(DISTDIR)) {
            DISTDIR = path.dirname(distdirPath) + path.sep + DISTDIR;
        }
    } else {
        DISTDIR ='dist/maniple';
    }

    grunt.file.recurse('src', function (abspath, rootdir, subdir, filename) {
        if (filename.match(/\.js$/)) {
            files[DISTDIR + (subdir ? path.sep + subdir : '') + path.sep + filename] = abspath;
        }
    });

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                // banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: files,
            }
        },
	jshint: {
            all: {
                src: [
                    "src/**/*.js", "Gruntfile.js",
                ]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('lint', ['jshint'] );

    grunt.loadNpmTasks('grunt-contrib-coffee');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'uglify']);

};
