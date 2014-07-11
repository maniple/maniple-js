module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                // banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: {
                    'dist/maniple/core.js' : 'src/core.js',
                    'dist/maniple/modal.js' : 'src/modal.js',
                    'dist/maniple/modal.ajaxform.js' : 'src/modal.ajaxform.js',
                    "dist/maniple/viewtils.js" : 'src/viewtils.js',
                },
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

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'uglify']);

};
