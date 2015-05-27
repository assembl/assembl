//Configuration

var paths = {
    css: 'assembl/static/sass',
    sass: ['assembl/static/css/**/*.scss', 'assembl/static/css/*.scss']
}

//Require
var sass = require('gulp-sass');
var size = require('gulp-size');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat-sourcemap');

// Gulp Dependencies
var gulp = require('gulp');
var rename = require('gulp-rename');
var streamify = require('gulp-streamify');

// Build Dependencies
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var browserify = require('browserify');

// Browserify
gulp.task('browserify', function() {
  browserify('./assembl/static/js/app/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('./assembl/static/js/build/'));
});

//Infrastructure
gulp.task('libs', function() {
  browserify('./assembl/static/js/app/browser.js')
    .bundle()
    .pipe(source('infrastructure.js'))
    .pipe(gulp.dest('./assembl/static/js/build/'));
});

gulp.task('watch', function() {
    gulp.watch('./assembl/static/js/app/**/*.js', ['browserify']);
    //gulp.watch('client/**/*.less', ['styles']);
});

gulp.task('uglify', function() {
    return gulp.src('./assembl/static/js/app/index.js')
        .pipe(uglify())
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest('./assembl/static/js/build/'));
});

// Tasks
gulp.task('build', ['browserify','uglify']);
gulp.task('default', ['build', 'watch']);
