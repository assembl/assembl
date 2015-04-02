//Configuration

var paths = {
    css: 'assembl/static/sass',
    sass: ['assembl/static/css/**/*.scss', 'assembl/static/css/*.scss']
}

//Require
var gulp = require('gulp');
var sass = require('gulp-sass');
var size = require('gulp-size');
var autoprefixer = require('gulp-autoprefixer');


//Tasks
gulp.task('sass', function() {

    gulp.src('assembl/static/css/_assembl_base_styles.scss')
        .pipe(sass({
            includePaths: ['assembl/static/css'],
            onError: console.error.bind(console, 'SASS Error')
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest('assembl/static/sass'))
        .pipe(size());

});

gulp.task('watch', function() {
    gulp.watch('assembl/static/css/_assembl_base_styles.scss', ['sass']);
});

gulp.task('default',['sass', 'watch'], function() {


});

