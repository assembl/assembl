var gulp = require('gulp'),
    watch = require('gulp-watch'),
	sass =  require('gulp-sass'),
    clean = require('gulp-clean');

gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass({ style: 'compressed', errLogToConsole: true }))
        .pipe(gulp.dest('./css/'));
});

gulp.task('watch', function () {
    gulp.watch([
        './scss/*.scss'
    ], function () {
        gulp.start('sass');
    })
})

gulp.task('clean', function() {
    return gulp.src(['./css/'], {read: false})
        .pipe(clean());
});

gulp.task('default',['clean'], function(){
    gulp.start('sass', 'watch');
})
