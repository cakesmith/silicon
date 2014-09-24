var gulp = require('gulp');

var serve = require('gulp-serve');
var livereload = require('gulp-livereload');

gulp.task('statics', serve({
  port: 3000,
  root: './dist'
}));

gulp.task('serve', ['statics'], function () {
  var server = livereload();
  gulp.watch(['./**/*.html', './**/*.js']).on('change', function (file) {
    server.changed(file.path);
  });
});

gulp.task('test', function() {

});

gulp.task('dist', function() {
  var jointDir = 'node_modules/jointjs/dist/';
  var prefix = 'all';
  var jointFiles = [jointDir + 'joint.' + prefix + '.js', jointDir + 'joint.' + prefix + '.css'];
  var srcDir = 'src/';
  var srcFiles = [srcDir + '**/*.html', srcDir + '**/*.js'];

  gulp.src(jointFiles.concat(srcFiles))
    .pipe(gulp.dest('dist'));
});

