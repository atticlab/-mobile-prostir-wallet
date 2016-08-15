var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    rename = require('gulp-rename'),
    babel = require('gulp-babel');

gulp.task('bundle', function() {
    gulp.src('src/app.js')
        .pipe(browserify({
            transform: ['mithrilify']
        }))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('../www/js/'))
});


gulp.task('default', ['bundle'], function() {
    gulp.watch('./src/**/*.js', ['bundle']);
});