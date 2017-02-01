var gulp = require('gulp');
var runSequence = require('run-sequence'); // sequence of tasks
var debug = require('gulp-debug'); // debug
var del = require('del'); // delete dist
var newer = require('gulp-newer'); // checks for file changes
var sass = require('gulp-sass'); // sass
var autoprefixer = require('gulp-autoprefixer'); // autoprefixer

// file locations
var src = 'src/';
var sassDir = src +'styles/**/*.scss';
var sassSrc = src + 'styles/index.scss';

var dist = './dist/';
var sassDist = dist + 'styles/';

// delete dist
gulp.task('clean', function() {
  return del.sync('dist');
});

// sass
gulp.task('sass', function() {
  gulp.src(sassSrc)
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: 'compressed'
    }))
    .on('error', function(err){
      console.log(err.message);
    })
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(sassDist));
});

gulp.task('default', function(cb) {
  runSequence('clean', ['sass'], cb);
  gulp.watch(sassDir, ['sass']);
});
