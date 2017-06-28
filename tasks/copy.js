module.exports = function(grunt,config){
  var appCustom = {
    expand: true,
    cwd: config.customAppFolder,
    src: '**/*',
    dest: config.appFolder + '/'
  };

  return {
    build: {
      files: [
        {
          src: 'index.html',
          dest: '<%= config.buildDir %>/index.html'
        }, {
          src: [
            'assets/images/**.*',
            'node_modules/cui-i18n-bcbsm/dist/cui-i18n/angular-translate/*.json',
            'node_modules/angular-i18n/*.js',
            'node_modules/@covisint/cui-icons/iconList',
            'node_modules/@covisint/cui-icons/dist/**/*.svg',
            'node_modules/cui-i18n-bcbsm/dist/cui-i18n/angular-translate/countries/*.json',
            'node_modules/cui-i18n-bcbsm/dist/cui-i18n/angular-translate/timezones/*.json',
            'node_modules/lato-font/fonts/lato-normal/**',
            'node_modules/lato-font/fonts/lato-bold/**',
            'node_modules/lato-font/fonts/lato-black/**',
            'app/json/*.json'
          ],
          dest: '<%= config.buildDir %>/'
        },
        {
          src: 'appConfig.json',
          dest: '<%= config.buildDir %>/appConfig.json'
        },
        appCustom
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
  };
};
