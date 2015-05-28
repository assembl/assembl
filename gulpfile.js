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
var streamify = require('gulp-streamify');

// Build Dependencies
var uglify = require('gulp-uglifyjs');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');

// Browserify
gulp.task('browserify', function() {
    var b = browserify({
        entries: './assembl/static/js/app/index.js',
        debug: true
    });
    return b.bundle()
    .pipe(source('index.js'))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('./assembl/static/js/build/'));
});

//Infrastructure
gulp.task('libs', function() {
  return gulp.src([
        './assembl/static/js/bower/underscore/underscore.js',
        './assembl/static/js/bower/jquery/dist/jquery.js',
        './assembl/static/js/bower/backbone/backbone.js',
        './assembl/static/js/bower/marionette/lib/backbone.marionette.js',
        './assembl/static/js/bower/backbone-modal/backbone.modal.js',
        './assembl/static/js/bower/sockjs/sockjs.js',
        './assembl/static/js/bower/ckeditor/ckeditor.js',
        './assembl/static/js/bower/cytoscape/dist/cytoscape.js',
        './assembl/static/js/bower/jquery.dotdotdot/src/js/jquery.dotdotdot.js',
        './assembl/static/js/bower/jquery-oembed-all/jquery.oembed.js',
        './assembl/static/js/bower/bootstrap-growl/jquery.bootstrap-growl.js',
        './assembl/static/js/lib/bootstrap.js',
        './assembl/static/js/lib/dropdown.js',
        './assembl/static/js/lib/annotator/annotator-full.js'
  ])
    .pipe(uglify())
    .pipe(rename('infrastructure.min.js'))
    .pipe(gulp.dest('./assembl/static/js/build/'));
});

gulp.task('watch', function() {
    gulp.watch('./assembl/static/js/app/**/*.js', ['browserify']);
    //gulp.watch('client/**/*.less', ['styles']);
});

/*gulp.task('uglify', function() {
    return gulp.src('./assembl/static/js/app/index.js')
        .pipe(uglify())
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest('./assembl/static/js/build/'));
});*/

// Tasks
gulp.task('build', ['browserify']);
gulp.task('default', ['build', 'watch']);
