module.exports = function(grunt) {
  var loadGruntTasks = require('load-grunt-tasks');

  loadGruntTasks(grunt);
  loadGruntTasks(grunt, { config: 'node_modules/@covisint/cui-idm-b2x/package.json' });
  const path = require('path');
  const YAML = require('yamljs');

  // Load the package.json file to have its variables available
  var pkgJson = require('./package.json');
  const i18npkgJson = require('./node_modules/@covisint/cui-i18n/package.json')
  const appName = pkgJson.name.split('/').pop();
  const dtStamp = grunt.template.today('yyyymmddhhMMss');

  // look for a target specified in the command line, otherwise assume 'local'
  const target = (typeof grunt.option('target') === 'undefined') ? 'local' : grunt.option('target');
  const buildArtifact = appName + '-' + pkgJson.version + '-' + target + '-' + dtStamp + '.zip';

  // Check if the "HOME" environment variable exists
  if (!process.env['HOME']) {
    grunt.log.writeln('This project requires a "HOME" environment variable.')
    grunt.log.writeln('The "HOME" environment variable should resemble: "C:\\Users\\username\\"')
    grunt.fail.warn('No "HOME" environment variable set on this machine.', [3])
  }

  // load the secrets profile file from your home directory
  const envPath = path.join(process.env['HOME'],'.cui/profiles',appName,target);

  var clientId, clientSecret, originUri, uiHost, serviceUrl, solutionInstancesUrl;

  //if the envPath does not exist, create it
  if (!grunt.file.exists(envPath)) {

    var emptyEnv = {
      clientId,
      clientSecret,
      originUri,
      uiHost,
      serviceUrl,
      solutionInstancesUrl
    };

    grunt.log.writeln('Creating a profile for you to store secrets.');
    grunt.file.write(envPath, YAML.stringify(emptyEnv));
    grunt.log.writeln('An empty profile has been created for you at: ' + envPath);

  }

  // now that we know it exists, we can read it, but trap it just in case
  var env = grunt.file.readYAML(envPath);

  clientId = (typeof grunt.option('clientId') === 'undefined') ? env.clientId : grunt.option('clientId');
  clientSecret = (typeof grunt.option('clientSecret') === 'undefined') ? env.clientSecret : grunt.option('clientSecret');
  originUri = (typeof grunt.option('originUri') === 'undefined') ? env.originUri : grunt.option('originUri');
  uiHost = (typeof grunt.option('uiHost') === 'undefined') ? env.uiHost : grunt.option('uiHost');
  serviceUrl = (typeof grunt.option('serviceUrl') === 'undefined') ? env.serviceUrl : grunt.option('serviceUrl');
  solutionInstancesUrl = (typeof grunt.option('solutionInstancesUrl') === 'undefined') ? env.solutionInstancesUrl : grunt.option('solutionInstancesUrl');

  var config = {
    buildDir : './build',
    buildSdkDir : './build-sdk',
    artifactDir : './build-artifacts',
    concatAppDir: './assets/concat/js/app.js',
    concatCssDir: './assets/concat/css/main.css',
    modules: './app/modules',
    scss: './app/scss',
    appFolder: './app',
    customAppFolder: './app-custom',
    nonConcatHtmlFolder: 'non-concat/',
    target: target,
    version: pkgJson.version,
    name: appName,
    userHomeDir: process.env['HOME'],
    clientId: clientId,
    clientSecret: clientSecret,
    originUri: originUri,
    uiHost: uiHost,
    buildArtifact: buildArtifact,
    serviceUrl: serviceUrl,
    solutionInstancesUrl: solutionInstancesUrl,
    i18nVersion: i18npkgJson.version
  };

  // now build the appConfig-env.json
  var appConfigEnv = {
    originUri: config.originUri,
    serviceUrl: config.serviceUrl,
    solutionInstancesUrl: config.solutionInstancesUrl
  };

  grunt.file.write('appConfig-env.json', JSON.stringify(appConfigEnv, null, 4));

  // now build the appConfig-build.json
  var appConfigBuild = {
    app: appName,
    version: config.version,
    target: config.target,
    buildDate: grunt.template.today('yyyymmddhhMMss'),
    buildArtifact: config.buildArtifact
  };

  grunt.file.write('appConfig-build.json', JSON.stringify(appConfigBuild, null, 4));

  var tasks = ['watch','sass','browserSync','postcss','clean','compress','copy','filerev','useminPrepare',
  'usemin','uglify','jshint','ngtemplates','processhtml','babel','ngAnnotate','http_upload'];

  var opts = {
    config:config
  };

  tasks.forEach(function(task) {
    opts[task] = require('./tasks/' + task + '.js')(grunt, config);
  });

  grunt.initConfig(opts);

  var missingEnv = 'It seems you need to set the target environment profile.\nPlease review ' + envPath + '\n';
  if(!config.originUri || !config.serviceUrl || !config.solutionInstancesUrl){
    grunt.fail.warn(missingEnv, 400);
  }

  grunt.registerTask('concatModules', 'Task to concat all project modules.',
    require('./tasks/concatModules.js')(grunt,config));

  // Tasks ------------------------------------------------------------
  grunt.registerTask('default', ['copy:dev','concatModules','babel','ngAnnotate','sass',
    'postcss','browserSync:dev','watch']);

    grunt.registerTask('build', ['sass','postcss','ngtemplates:build','clean:build','copy:build',
        'concatModules','babel','ngAnnotate','useminPrepare','concat:generated',
    'cssmin:generated','uglify:generated','filerev:build','usemin','clean:temp']);

  grunt.registerTask('demo', ['browserSync:demo']);

  grunt.registerTask('jslint', ['jshint']);

  grunt.registerTask('package', ['build','compress']);

  grunt.registerTask('deploy', ['build','compress','http_upload:build']);

};
