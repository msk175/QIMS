module.exports = function(grunt,config){
  return {
    build: {
      options: {
        commentMarker: 'processHTML'
      },
      files: [{
        expand: true,
        cwd: '<%= config.appFolder %>/',
        src: ['modules/**/*.html', 'common-templates/**/*.html'],
        dest: '<%= config.appFolder %>/'
      }]
    }
  };
};