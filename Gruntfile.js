module.exports = function(grunt) {
    var loadGruntTasks = require('load-grunt-tasks');

    loadGruntTasks(grunt);
    loadGruntTasks(grunt, { config: 'node_modules/@covisint/cui-idm-b2x/package.json' });

    var config = {
        buildDir : './build',
        buildSdkDir : './build-sdk',
        concatAppDir: './assets/concat/js/app.js',
        concatCssDir: './assets/concat/css/main.css',
        modules: './app/modules',
        scss: './app/scss',
        appFolder: './app',
        customAppFolder: './app-custom',
        nonConcatHtmlFolder: 'non-concat/'
    };

    var tasks = ['watch','sass','browserSync','postcss','clean','copy','filerev','useminPrepare',
        'usemin','uglify','jshint','ngtemplates','processhtml','babel','ngAnnotate'];

    var opts = {
        config:config
    };

    tasks.forEach(function(task) {
        opts[task] =require('./tasks/' + task + '.js')(grunt, config);
    });

    grunt.initConfig(opts);

    grunt.registerTask('concatModules', 'Task to concat all project modules.', require('./tasks/concatModules.js')(grunt,config));


    // Tasks ------------------------------------------------------------
    grunt.registerTask('default', ['copy:dev','concatModules','babel','ngAnnotate','sass','postcss','browserSync:dev','watch']);

    grunt.registerTask('build', ['sass','postcss','ngtemplates:build','clean:build','copy:build',
        'concatModules','babel','ngAnnotate','useminPrepare','concat:generated',
        'cssmin:generated','uglify:generated','filerev:build','usemin','clean:temp']);

    grunt.registerTask('demo', ['browserSync:demo']);

    grunt.registerTask('jslint', ['jshint']);

};
