var gulp = require('gulp');

var serve = require('gulp-serve');
var livereload = require('gulp-livereload');

var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');

var jasmine = require('gulp-jasmine');

gulp.task('test', function () {
  return gulp.src(['./src/**/*.js', './test/**/*.js'])
    .pipe(jasmine());
});

gulp.task('test-ci', ['test'], function () {
  gulp.watch(['./src/**/*.js', './test/**/*.js'], ['test']);
});

var fileName = 'silicon';

function rebundle(bundler) {
  return bundler.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(fileName + '.js'))
    .pipe(gulp.dest('./dist'));
}

gulp.task('bundle', function () {
  var opts = {
    standalone: fileName
  };
  var bundler = browserify('./src/' + fileName, opts);
  return rebundle(bundler);
});

gulp.task('bundle-min', function () {
  var opts = {
    debug: true,
    standalone: fileName
  };
  var bundler = new browserify(opts);
  bundler.add('./src/' + fileName + '.js');
  bundler.plugin('minifyify', {
    map   : fileName + '.map.json',
    output: './dist/' + fileName + '.map.json'
  });
  return rebundle(bundler);
});

gulp.task('watch', ['serve'], function() {
  gulp.watch(['src/**/*.*'], ['dist']);
});

gulp.task('watch-bundle', function () {
  watchify.args['standalone'] = fileName;
  watchify.args['verbose'] = 'true';
  var bundler = watchify(browserify('./src/' + fileName + '.js', watchify.args));

  bundler.on('update', function() {
    rebundle(bundler);
  });

  return rebundle(bundler);
});

gulp.task('statics', serve({
  port: 3000,
  root: './dist'
}));

gulp.task('serve', ['dist', 'statics'], function () {
  var server = livereload();
  gulp.watch(['./**/*.html', './**/*.js']).on('change', function (file) {
    server.changed(file.path);
  });
});

gulp.task('dist', function() {
  var jointDir = 'node_modules/jointjs/dist/';
  var prefix = 'all';
  var jointFiles = [jointDir + 'joint.' + prefix + '.js', jointDir + 'joint.' + prefix + '.css'];
  var srcDir = 'src/';
  var srcFiles = [srcDir + '**/*.html', srcDir + '**/*.js', srcDir + '**/*.css'];
  var libDir = 'lib/';
  var libFiles = [libDir + '**/*.*'];

  gulp.src(srcFiles.concat(jointFiles.concat(libFiles)))
    .pipe(gulp.dest('dist'));
});

