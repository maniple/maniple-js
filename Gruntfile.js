module.exports = function(grunt) {

    var findup = require('findup-sync');

    var distdirPath = findup('maniple-js.distdir');

    var files = {};

    var DISTDIR;

    if (distdirPath) {
        DISTDIR = grunt.file.read(distdirPath).trim();
    } else {
        DISTDIR ='dist/maniple';
    }

    grunt.file.recurse('src', function (abspath, rootdir, subdir, filename) {
        if (filename.match(/\.js$/)) {
            files[DISTDIR + (subdir ? '/' + subdir : '') + '/' + filename] = abspath;
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
