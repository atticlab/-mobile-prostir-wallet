var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    rename = require('gulp-rename'),
    babel = require('gulp-babel');

gulp.task('bundle', function() {
    return gulp.src('src/app.js')
        .pipe(browserify({
            transform: ['mithrilify']
        }))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('../www/js/'))
        .on("end", function () {
            console.log("Done!");
        });
});


gulp.task('default', ['bundle'], function() {
    gulp.watch('./src/**/*.js', ['bundle']);
});