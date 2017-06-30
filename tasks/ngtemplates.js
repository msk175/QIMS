var htmlminOptions = {
  collapseBooleanAttributes: true,
  collapseWhiteSpace: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeReduntantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkAttributes: true
};

module.exports = function(grunt,config){
  return {
    build: {
      files:[
        {
          src: ['<%= config.appFolder.replace("./","") %>/**/*.html',
          '!<%= config.appFolder.replace("./","") %>/<%= config.nonConcatHtmlFolder %>/**/*'],
          dest: 'assets/concat/js/templateCache.js'
        }
      ],
      options: {
        htmlmin: htmlminOptions,
        module: 'app'
      }
    }
  };
};