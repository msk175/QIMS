module.exports = function(grunt,config){
  return {
    customScss:{
      files: ['app-custom/**/*'],
      tasks: ['copy:customApp'] // copy the files from app-custom to app
    },
    css:{
      files: config.scss + '/**/*',
      tasks: ['sass','postcss']
    },
    scripts:{
      files: [config.appFolder + '/**/*.js'],
      tasks: ['concatModules','babel'],
      options: {
        spawn: false,
      },
    }
  };
};