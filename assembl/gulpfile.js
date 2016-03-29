'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var size = require('gulp-size');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var del = require('del');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var exit = require('gulp-exit');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');

var path = {
        js: 'static/js',
        css: 'static/css'
    }

var b = watchify(browserify({
    entries: path.js+'/app/index.js',
    debug: true
}));

/***
 * build assembl for development
 */
gulp.task('browserify:dev', ['clean:app'], bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle(){
    return b.bundle()
      .on('error', gutil.log)
      .on('error', function(cb) {
        console.log("Compile failed, deleting output");
        clean_app();
      })
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true, debug: true}))
      .pipe(rename('app.js'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(path.js+'/build/'))
}

/***
 * build assembl for production
 */
gulp.task('browserify:prod',['clean:app'] ,function() {
    var b = browserify({
        entries: path.js+'/app/index.js',
        debug: true
    });
    return b.bundle()
        .on('error', gutil.log)
        .on('error', function(cb) {
          console.log("Javascript compile failed, deleting output");
          clean_app();
        })
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true, debug: true}))
        .pipe(rename('app.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.js+'/build/'))
        .pipe(exit());
});

/**
 * Infrastructure
 * */
gulp.task('libs',['clean:infrastructure'], function() {
  return gulp.src([
      path.js+'/bower/jquery/dist/jquery.js',
      path.js+'/bower/underscore/underscore.js',
      path.js+'/bower/backbone/backbone.js',
      path.js+'/bower/marionette/lib/backbone.marionette.js',
      path.js+'/bower/backbone-modal/backbone.modal.js',
      path.js+'/bower/Backbone.Subset/backbone.subset.js',
      path.js+'/bower/backbone-model-file-upload/backbone-model-file-upload.js',
      path.js+'/bower/sockjs/sockjs.js',
      //path.js+'/lib/ckeditor/ckeditor.js',// need a proper solution to make CKEDITOR global var
      //path.js+'/bower/ckeditor/ckeditor.js',
      path.js+'/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.js',
      path.js+'/bower/jquery-oembed-all/jquery.oembed.js',
      path.js+'/bower/bootstrap-growl/jquery.bootstrap-growl.js',
      //path.js+'/bower/jQuery-linkify/dist/jquery.linkify.js',
      path.js+'/lib/jquery-highlight/jquery.highlight.js',
      path.js+'/bower/hopscotch/dist/js/hopscotch.js',
      path.js+'/lib/bootstrap.js',
      path.js+'/lib/dropdown.js',
      path.js+'/lib/annotator/annotator-full.js',
      path.js+'/lib/ckeditor-sharedcontainer/plugin.js',

  ], { base: path.js })
    .pipe(sourcemaps.init({loadMaps: true, debug: true}))
    .pipe(concat('infrastructure.concat.js'))
    .pipe(uglify({compress: true }))
    .pipe(rename('infrastructure.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(path.js+'/build/'))
    .pipe(exit());
});


gulp.task('build:test', function() {

    var b = browserify({
        entries: path.js+'/app/tests.js',
        debug: true
    });
    return b.bundle()
        .on('error', function() {
            console.log("Compile failed, deleting output");
            clean_app();
        })
        .pipe(source('init.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(gulp.dest(path.js+'/build/tests/tmp')) // output an intermediate copy of init.js
        .pipe(uglify({
            compress: false,
            mangle: false
        }).on('error', gutil.log))
        .pipe(rename('specs.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.js+'/build/tests'))
        .pipe(exit());
});

var gulpSass_logConsole = function (error) {
  var message = new gutil.PluginError('sass', error.messageFormatted).toString();
  process.stdout.write(message + '\n');
  this.emit('end');
};

var bourbon_includePaths = require("node-bourbon").includePaths;
/**
 * Compile Sass file
 * not work for now, we need to delete all @include in sass file
 * */
gulp.task('sass', ['clean:generated_css'], function() {
    return gulp.src(path.css+'/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
          includePaths: bourbon_includePaths
        }).on('error', gulpSass_logConsole)
          .on('error', function(cb) {
            console.log("SASS compile failed, deleting output");
            clean_generated_css();
        }))
        /*.pipe(sourcemaps.write())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        //.pipe(minifyCss())*/
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.css));
});

function clean_generated_css (cb) {
  del([path.css+'/themes/**/*.css', path.css+'/themes/**/*.css.map'], cb);
}
gulp.task('clean:generated_css', clean_generated_css);

gulp.task('watch_sass', function () {
  gulp.watch([
      path.css+'/**/*.scss'
  ], function () {
      gulp.start('sass');
  })
})
/**
 * Delete files before rebuild new one
 * */
function clean_app (cb) {
  del([path.js+'/build/app.js',path.js+'/build/app.js.map'], cb);
}

gulp.task('clean:app', clean_app);

gulp.task('clean:infrastructure', function (cb) {
    del([path.js+'/build/infrastructure.min.js',path.js+'/build/infrastructure.min.js.map'], cb);
});

/**
 * Tasks
 * */

gulp.task('build:source', ['libs','browserify:dev']);
gulp.task('build:prod', ['libs','browserify:prod']);
gulp.task('default', ['watch_sass', 'browserify:dev']);
