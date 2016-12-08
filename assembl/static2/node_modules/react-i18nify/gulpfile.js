const gulp = require('gulp');
const babel = require('gulp-babel');
const gdt = require('gulp-dev-tasks');
const eslintrc = require('./.eslintrc.json');

const source = ['src/**/*.js', 'src/**/*.jsx'];

gdt.setRules(eslintrc.rules);

gulp.task('build', () => (
  gulp.src(source)
    .pipe(babel({ presets: ['es2015', 'react', 'stage-1'] }))
    .pipe(gulp.dest('build/'))
));

gulp.task('default', ['lint', 'build'], () => {
  gulp.watch(source, ['lint', 'build']);
});
