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
var mocha = require('gulp-mocha');
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
gulp.task('browserify:dev', ['clean:app'],bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle(){
    return b.bundle()
      .on('error', gutil.log)
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
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
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify({
            compress: false
         }))
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
    .pipe(uglify({compress: false }))
    .pipe(rename('infrastructure.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(path.js+'/build/'))
    .pipe(exit());
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
    return gulp.src(path.css+'/**/*.scss')
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        //.pipe(minifyCss())
        .pipe(gulp.dest(path.css));
});


/**
 * Delete files before rebuild new one
 * */
gulp.task('clean:app', function (cb) {
    del([path.js+'/build/app.js',path.js+'/build/app.js.map'], cb);
});

gulp.task('clean:infrastructure', function (cb) {
    del([path.js+'/build/infrastructure.min.js',path.js+'/build/infrastructure.min.js.map'], cb);
});

/**
 * Tasks
 * */

gulp.task('build:source', ['libs','browserify:dev']);
gulp.task('build:prod', ['browserify:prod', 'libs']);
gulp.task('default', ['browserify:dev']);
