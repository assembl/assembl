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
var minifyCss = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var exit = require('gulp-exit');
var mocha = require('gulp-mocha');
var buffer = require('vinyl-buffer');

var jsPath = './assembl/static/js';

var b = watchify(browserify({
    entries: jsPath+'/app/index.js',
    debug: true
}));

/***
 * build assembl for development
 */
gulp.task('browserify', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle(){
    return b.bundle()
      .on('error', gutil.log)
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init())
      .pipe(rename('app.js'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(jsPath+'/build/'))
}

/***
 * build assembl for production
 */
gulp.task('browserify-build', function() {
    var b = browserify({
        entries: './assembl/static/js/app/index.js',
        debug: true
    });
    return b.bundle()
        .on('error', gutil.log)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename('app.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(jsPath+'/build/'))
        .pipe(exit());
});

/**
 * Infrastructure
 * */
gulp.task('libs', function() {
  return gulp.src([
        jsPath+'/bower/underscore/underscore.js',
        jsPath+'/bower/jquery/dist/jquery.js',
        jsPath+'/bower/backbone/backbone.js',
        jsPath+'/bower/marionette/lib/backbone.marionette.js',
        jsPath+'/bower/backbone-modal/backbone.modal.js',
        jsPath+'/bower/sockjs/sockjs.js',
        jsPath+'/bower/ckeditor/ckeditor.js',
        jsPath+'/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.js',
        jsPath+'/bower/jquery-oembed-all/jquery.oembed.js',
        jsPath+'/bower/bootstrap-growl/jquery.bootstrap-growl.js',
        jsPath+'/bower/jQuery-linkify/dist/jquery.linkify.js',
        jsPath+'/lib/bootstrap.js',
        jsPath+'/lib/dropdown.js',
        jsPath+'/lib/annotator/annotator-full.js'
  ])
    .pipe(uglify('infrastructure.min.js', {
          outSourceMap: true
     }))
    .pipe(gulp.dest(jsPath+'/build/'))
});

/**
 * Run test
 * */
gulp.task('tests', function() {
    return gulp.src(['./assembl/static/js/app/tests/*.spec.js'], {read: false})
        .pipe(mocha({
            reporter:'spec'
        }))
});

/**
 * Compile Sass file
 * not work for now, we need to delete all @include in sass file
 * */
gulp.task('sass', function() {
    return gulp.src('./assembl/static/css/**/*.scss')
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        //.pipe(minifyCss())
        .pipe(gulp.dest('./assembl/static/css'));
});


/**
 * Tasks
 * */
gulp.task('build:dev', ['browserify']);
gulp.task('build:prod', ['libs','browserify-build']);
gulp.task('default', ['build:dev']);
