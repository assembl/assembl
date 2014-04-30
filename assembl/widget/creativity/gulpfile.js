var gulp = require('gulp'),
	gutil = require('gulp-util'),
    watch = require('gulp-watch'),
	sass =  require('gulp-sass');

gulp.task('sass', function () {
    gulp.src('./app/scss/*.scss')
        .pipe(sass({ style: 'compressed', errLogToConsole: true }))
        .pipe(gulp.dest('./app/css/'));
});

gulp.task('watch', function () {
    gulp.watch([
        './app/scss/*.scss'
    ], function () {
        gulp.start('sass');
    })
})

gulp.task('default', ['sass', 'watch']);
