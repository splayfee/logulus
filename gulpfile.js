"use strict";

var exec = require("child_process").exec;

var conform = require("gulp-conformity");
var del = require("del");
var eslint = require("gulp-eslint");
var gulp = require("gulp");
var istanbul = require("gulp-istanbul");
var jsonlint = require("gulp-jsonlint");
var mocha = require("gulp-mocha");
var runSequence = require("run-sequence");

var APP_SRC = ["index.js", "./lib/**/*.js"];
var TEMP_SRC = ["./coverage/**/*"];
var TEST_SRC = ["./test/**/*_tests.js"];
var ALL_SRC = [].concat(APP_SRC, TEST_SRC, "./gulpfile.js");

function handleError(err) {
  console.log(err.toString());
  this.emit("end");
}

gulp.task("default", function (cb) {
  runSequence("clean", ["conform", "lint", "coverage"], cb);
});


gulp.task("clean", function (done) {
  del(TEMP_SRC, done);
});

gulp.task("conform", function(){
  gulp.src("./")
    .pipe(conform());
});

gulp.task("coverage", function (callback) {
  gulp.src(APP_SRC)
    .pipe(istanbul())
    .on("finish", function () {
      gulp.src(TEST_SRC)
        .pipe(mocha({
          reporter: "spec"
        }))
        .pipe(istanbul.writeReports())
        .on("end", callback);
    });
});

gulp.task("docs", function () {
  exec("npm run-script docs", function (err, stdout, stderr) {
    if(err){
      return console.log(err);
    }
  });
});

gulp.task("lint", function () {
  gulp.src(ALL_SRC)
    .pipe(eslint())
    .pipe(eslint.format("stylish", console.error));

  gulp.src("./pacakge.json")
    .pipe(jsonlint())
    .pipe(jsonlint.reporter("stylish", console.error));
});

gulp.task("test", ["clean"], function () {
    gulp.src(TEST_SRC)
      .pipe(mocha({
        reporter: "spec"
      }).on("error", handleError));
});

gulp.task("watch", function () {
  gulp.watch([APP_SRC, TEST_SRC], ["lint", "test"]);
});