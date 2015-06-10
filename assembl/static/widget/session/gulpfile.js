var gulp = require('gulp'),
    watch = require('gulp-watch'),
	sass =  require('gulp-sass'),
    clean = require('gulp-clean'),
    autoprefixer = require('gulp-autoprefixer');


var path = {
    css: './css',
    sass: './scss'
}

/*gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass({ style: 'compressed', errLogToConsole: true }))
        .pipe(gulp.dest('./css/'));
});*/

gulp.task('sass', function() {
    return gulp.src(path.sass+'/**/*.scss')
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        //.pipe(minifyCss())
        .pipe(gulp.dest(path.css));
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
