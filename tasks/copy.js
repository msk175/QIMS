module.exports = function(grunt,config){
  var appCustom = {
    expand: true,
    cwd: config.customAppFolder,
    src: '**/*',
    dest: config.appFolder + '/'
  };

  var nonConcatFolder = {
    src: config.appFolder + '/' + config.nonConcatHtmlFolder + '/**/*',
    dest: config.buildDir + '/'
  };

  return {
    build: {
      files: [
        {
            src: 'index.html',
            dest: '<%= config.buildDir %>/index.html'
        },
        {
            src: [
            'node_modules/@covisint/cui-i18n/dist/<%= config.i18nVersion %>/cui-i18n/angular-translate/*.json',
            'node_modules/angular-i18n/*.js',
            'node_modules/@covisint/cui-icons/iconList',
            'node_modules/@covisint/cui-icons/dist/**/*.svg',
            'node_modules/@covisint/cui-i18n/dist/<%= config.i18nVersion %>/cui-i18n/angular-translate/countries/*.json',
            'node_modules/@covisint/cui-i18n/dist/<%= config.i18nVersion %>/cui-i18n/angular-translate/timezones/*.json',
            'node_modules/@covisint/cui-i18n/package.json',
            'node_modules/lato-font/fonts/lato-normal/**',
            'node_modules/lato-font/fonts/lato-bold/**',
            'node_modules/lato-font/fonts/lato-black/**',
            'appConfig.json',
            'appConfig-env.json',
            'appConfig-build.json',
            'app/json/*.json',
            'package.json'
            ],
            dest: '<%= config.buildDir %>/'
        },
        appCustom,
        nonConcatFolder
      ]
    },
    dev: {
      files: [
        appCustom
      ]
    },
    customApp : {
      files:[
        appCustom
      ]
    }
  }
}
