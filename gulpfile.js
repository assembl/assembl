'use strict';

//Require
var sass = require('gulp-sass');

// Gulp Dependencies
var gulp = require('gulp');
var rename = require('gulp-rename');
var size = require('gulp-size');

// Build Dependencies
var uglify = require('gulp-uglifyjs');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var minifycss = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var exit = require('gulp-exit');

var jsPath = './assembl/static/js';
var sassFiles = ["./assembl/static/css/themes/_assembl_base_styles.scss"];

var b = watchify(browserify({
    entries: jsPath+'/app/index.js',
    debug: true
}));

// Browserify
gulp.task('browserify', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle(done){
    return b.bundle()
      .pipe(source('index.js'))
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(rename('app.js'))
      .pipe(sourcemaps.write(jsPath+'/build/'))
      .pipe(gulp.dest(jsPath+'/build/'))
}

//Infrastructure
gulp.task('libs', function() {
  return gulp.src([
        jsPath+'/bower/underscore/underscore-min.js',
        jsPath+'/bower/jquery/dist/jquery.min.js',
        jsPath+'/bower/backbone/backbone.js',
        jsPath+'/bower/marionette/lib/backbone.marionette.min.js',
        jsPath+'/bower/backbone-modal/backbone.modal-min.js',
        jsPath+'/bower/sockjs/sockjs.min.js',
        jsPath+'/bower/ckeditor/ckeditor.js',
        jsPath+'/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.min.js',
        jsPath+'/bower/jquery-oembed-all/jquery.oembed.js',
        jsPath+'/bower/bootstrap-growl/jquery.bootstrap-growl.min.js',
        jsPath+'/bower/jQuery-linkify/dist/jquery.linkify.min.js',
        jsPath+'/lib/bootstrap.js',
        jsPath+'/lib/dropdown.js',
        jsPath+'/lib/annotator/annotator-full.min.js'
  ])
    .pipe(uglify('infrastructure.min.js',{
          compress: false
      }))
    .pipe(size())
    .pipe(gulp.dest(jsPath+'/build/'))
    .pipe(exit());
});


/***
 * build assembl
 */
gulp.task('browserify-build', function() {
    var b = browserify({
        entries: './assembl/static/js/app/index.js',
        debug: true
    });
    return b.bundle()
        .on('error', function(err){
            console.error('Browserify failed :', err.message);
            this.emit('end');
        })
        .pipe(source('index.js'))
        .pipe(uglify())
        .pipe(rename('app.js'))
        .pipe(gulp.dest('./assembl/static/js/build/'))
        .pipe(exit());
});


// Tasks
gulp.task('run', ['browserify']);
gulp.task('build', ['browserify-build']);
gulp.task('default', ['build']);
