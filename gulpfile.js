var gulp = require('gulp');
var tslint = require('gulp-tslint');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var gulpCopy = require('gulp-copy');
const gulpZip = require('gulp-zip');
var gulpClean = require('gulp-clean');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var ts = require('gulp-typescript');
var through = require('through2');
var rollup = require('rollup');

var pkg = require('./package.json')

var lintFiles = [
    'src/*.ts',
];

function lint() {
    return gulp.src(lintFiles)
        .pipe(tslint({}))
        .pipe(tslint.report({ summarizeFailureOutput: true }));
};

/**
 * Build ts to js for rollup
 */
function tsc() {
    var tsProject = ts.createProject('./tsconfig.json');

    var typescript_error_count = 0;

    var tsResult = tsProject.src()
        .pipe(tsProject({
            reporter: ts.reporter.longReporter(),
            error: function () {
                typescript_error_count++;
                this.reporter.error.apply(this.reporter, arguments);
            },
            finish: function () {
                this.reporter.finish.apply(this.reporter, arguments);
            }
        }));

    return tsResult.pipe(gulp.dest('./src/'))
        .pipe(through.obj(function (chunk, enc, cb) {
            if (typescript_error_count) {
                this.emit("error", "TypeScript compile errors (count:" + typescript_error_count + ")");
            }
            cb(null, chunk)
        }));
};

function makeBundle() {
    var config = require('./rollup.config');

    return Promise.all(config.map(single =>
        rollup.rollup(single)
            .then(bundle => bundle.write(single.output))));
}

/**
 * build library with rollup
 */
const assemble = gulp.series(tsc, makeBundle);

function compress() {
    return gulp.src('bin/matrix.js')
        .pipe(uglify())
        .pipe(rename('matrix.min.js'))
        .pipe(gulp.dest('bin'));
};

function clean() {
    return gulp.src(['src/*.js', 'src/*.d.ts'], { read: false }).pipe(gulpClean())
}

const build = gulp.series(lint, assemble, compress, clean);

function zip() {
    return gulp.src([pkg.types, pkg.min]).pipe(gulpZip(`${pkg.name}-${pkg.version}.zip`)).pipe(gulp.dest('bin'))
}

exports.zip = zip;
exports.clean = clean;
exports.build = build;
exports.default = build;
