var options = {
  ghostMode: false,
  watchTask: true,
  online: true,
  port: 9001,
  server:{
    baseDir: './'
  }
}

module.exports = function(grunt,config){
  return {
    dev: {
      bsFiles: {
          src : [
              '**/*.html',
              '<%= config.concatAppDir %>',
              '**/*.css'
          ]
      },
      options: options
    },
    demo: {
      bsFiles: {
          src : [
              '**/*.html',
              '**/*.js',
              '**/*.css'
          ]
      },
      options: Object.assign({},options,{
        watchTask:false,
        server:{ baseDir: '<%= config.buildDir %>'}
      })
    }
  };
};