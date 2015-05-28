//Configuration

var paths = {
    css: 'assembl/static/sass',
    sass: ['assembl/static/css/**/*.scss', 'assembl/static/css/*.scss']
}

//Require
var sass = require('gulp-sass');

// Gulp Dependencies
var gulp = require('gulp');
var rename = require('gulp-rename');

// Build Dependencies
var uglify = require('gulp-uglifyjs');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');

var jsPath = './assembl/static/js';

// Browserify
gulp.task('browserify', function() {
    var b = watchify(browserify({
        entries: jsPath+'/app/index.js',
        debug: true
    }));
    return b.bundle()
    .pipe(source('index.js'))
    .pipe(rename('app.js'))
    .pipe(gulp.dest(jsPath+'/build/'));
});

//Infrastructure
gulp.task('libs', function() {
  return gulp.src([
        jsPath+'/bower/underscore/underscore.js',
        jsPath+'/bower/jquery/dist/jquery.js',
        jsPath+'/bower/backbone/backbone.js',
        jsPath+'/bower/marionette/lib/backbone.marionette.js',
        jsPath+'/bower/backbone-modal/backbone.modal.js',
        jsPath+'/bower/sockjs/sockjs.js',
        jsPath+'/bower/ckeditor/ckeditor.js',
        jsPath+'/bower/cytoscape/dist/cytoscape.js',
        jsPath+'/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.js',
        jsPath+'/bower/jquery-oembed-all/jquery.oembed.js',
        jsPath+'/bower/bootstrap-growl/jquery.bootstrap-growl.js',
        jsPath+'/lib/bootstrap.js',
        jsPath+'/lib/dropdown.js',
        jsPath+'/lib/annotator/annotator-full.js',
        jsPath+'/bower/jQuery-linkify/dist/jquery.linkify.js'
  ])
    .pipe(uglify())
    .pipe(rename('infrastructure.min.js'))
    .pipe(gulp.dest(jsPath+'/build/'));
});

gulp.task('watch', function() {
    gulp.watch(jsPath+'/app/**/*.js', ['browserify']);
    //gulp.watch('client/**/*.less', ['styles']);
});

/*gulp.task('uglify', function() {
    return gulp.src(jsPath+'/app/index.js')
        .pipe(uglify())
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest(jsPath+'/build/'));
});*/

// Tasks
gulp.task('build', ['browserify']);
gulp.task('default', ['build']);
