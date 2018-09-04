module.exports = function (grunt) {
   grunt.initConfig({
      browserify: {
         dist: {
            options: {
               transform: [
                  ["babelify", {
                  }]
               ]
            },
            files: {
               "./system/js/build/app3d.js": ["./system/js/src/apps/app3d.js"],
               "./system/js/build/app2d.js": ["./system/js/src/apps/app2d.js"],
               "./system/js/build/color-widget.js": ["./system/js/src/apps/color-settings.js"]
            }
         }
      },
      watch: {
         scripts: {
            files: ["./system/js/src/**/*.js", "../system/js/apps/*.js", ],
            tasks: ["browserify"]
         }
      }
   });

   grunt.loadNpmTasks("grunt-browserify");
   grunt.loadNpmTasks("grunt-contrib-watch");

   grunt.registerTask("default", ["watch"]);
   grunt.registerTask("build", ["browserify"]);
};