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
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var exit = require('gulp-exit');
var mocha = require('gulp-mocha');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');

var path = {
        js: 'static/js',
        css: ''
    }

var b = watchify(browserify({
    entries: path.js+'/app/index.js',
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
      .pipe(gulp.dest(path.js+'/build/'))
}

/***
 * build assembl for production
 */
gulp.task('browserify-build', function() {
    var b = browserify({
        entries: path.js+'/app/index.js',
        debug: true
    });
    return b.bundle()
        .on('error', gutil.log)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify({
            outSourceMap: 'app.js.map'
        }))
        .pipe(rename('app.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.js+'/build/'))
        .pipe(exit());
});

/**
 * Infrastructure
 * */
gulp.task('libs', function() {
  return gulp.src([
      path.js+'/bower/jquery/dist/jquery.js',
      path.js+'/bower/underscore/underscore.js',
      path.js+'/bower/backbone/backbone.js',
      path.js+'/bower/marionette/lib/backbone.marionette.js',
      path.js+'/bower/backbone-modal/backbone.modal.js',
      path.js+'/bower/sockjs/sockjs.js',
      path.js+'/bower/ckeditor/ckeditor.js',
      path.js+'/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.js',
      path.js+'/bower/jquery-oembed-all/jquery.oembed.js',
      path.js+'/bower/bootstrap-growl/jquery.bootstrap-growl.js',
      path.js+'/bower/jQuery-linkify/dist/jquery.linkify.js',
      path.js+'/bower/jquery-highlight/jquery.highlight.js',
      path.js+'/lib/bootstrap.js',
      path.js+'/lib/dropdown.js',
      path.js+'/lib/annotator/annotator-full.js'
  ], { base: path.js })
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(concat('infrastructure.concat.js'))
    .pipe(uglify({
          compress: false
      }))
    .pipe(rename('infrastructure.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(path.js+'/build/'))
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
gulp.task('build:source', ['libs','browserify']);
gulp.task('build:prod', ['libs','browserify-build']);
gulp.task('default', ['build:dev']);
