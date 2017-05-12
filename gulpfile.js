const path = require('path');
const gulp = require('gulp');

const plumber = require('gulp-plumber');
// server
const browserSync = require('browser-sync').create();
const SSI = require('browsersync-ssi');
// html
const htmlreplace = require('gulp-html-replace');
const minifyHTML = require('gulp-minify-html');
// js
// const minify = require('gulp-minify');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
// less
const less = require('gulp-less');
const LessAutoPrefix = require('less-plugin-autoprefix');
const minifycss = require('gulp-minify-css');
// images
const imagemin = require('gulp-imagemin');
const zip = require('gulp-zip');
const clean = require('gulp-clean');
const connect = require('gulp-connect');

const args = require('process.args')();
// options
const OUTPUT_PATH = path.resolve(__dirname, 'static/');
const DIST_PATH = path.resolve(__dirname, 'dist/');
const SCRIPT_PATH = path.resolve(__dirname, 'app/**/*.js');
const LESS_PATH = path.resolve(__dirname, 'app/**/*.less');
const IMAGES_PATH = path.resolve(__dirname, 'app/**/*.(jpg|png|ico|gif)');
const OTHER_PATH = path.resolve(__dirname, 'app/**/other/**');
const HTML_PATH = path.resolve(__dirname, 'app/**/*.html');

// server
gulp.task('serve', ['default'], function () {
    browserSync.init({
        server: {
            baseDir: [path.resolve(__dirname, './static')],
            middleware: SSI({
                baseDir: path.resolve(__dirname, './static'),
                ext: '.html',
                version: '1.0.0'
            })
        }
    });
    gulp.watch(SCRIPT_PATH, ['js']);
    gulp.watch(LESS_PATH, ['less']);
    gulp.watch(HTML_PATH, ['html']);
    gulp.watch(IMAGES_PATH, ['image']);
    gulp.watch(path.resolve(__dirname, 'static/**/*.html')).on('change', browserSync.reload);
});
// less
gulp.task('less', function () {
    return gulp.src(LESS_PATH)
        .pipe(plumber())
        .pipe(less({
            plugins: [new LessAutoPrefix({browsers: ['last 2 versions'], remove: false})]
        }))
        .pipe(gulp.dest(OUTPUT_PATH))
        .pipe(browserSync.stream());
});
gulp.task('less:build', function () {
    return gulp.src(LESS_PATH)
        .pipe(plumber())
        .pipe(less({
            plugins: [new LessAutoPrefix({browsers: ['last 2 versions'], remove: false})]
        }))
        .pipe(minifycss())
        .pipe(gulp.dest(DIST_PATH))
        .pipe(browserSync.stream());
});
// js
gulp.task('js', function () {
    return gulp.src(SCRIPT_PATH)
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(OUTPUT_PATH))
        .pipe(browserSync.stream());
});
gulp.task('js:build', function () {
    return gulp.src(SCRIPT_PATH)
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename({suffix: ''}))
        .pipe(uglify())
        .pipe(gulp.dest(DIST_PATH))
        .pipe(browserSync.stream());
});
// html
gulp.task('html', function () {
    return gulp.src(HTML_PATH)
        .pipe(plumber())
        .pipe(gulp.dest(OUTPUT_PATH))
        .pipe(browserSync.stream());
});
gulp.task('html:build', function () {
    const opts = {comments: false, spare: false, quotes: true};
    return gulp.src(HTML_PATH)
        .pipe(plumber())
        .pipe(htmlreplace({
            // 'css': 'css/style.css?t=' + new Date().getTime(),
            // 'js': 'js/index.min.js?t=' + new Date().getTime()
        }))
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest(DIST_PATH))
        .pipe(browserSync.stream());
});
// images
gulp.task('image', function () {
    return gulp.src(IMAGES_PATH)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(OUTPUT_PATH))
        .pipe(browserSync.stream());
});
// other
gulp.task('other', function () {
    return gulp.src(OTHER_PATH)
        .pipe(plumber())
        .pipe(gulp.dest(OUTPUT_PATH))
        .pipe(browserSync.stream());
});

// build
gulp.task('build', ['html:build', 'js:build', 'less:build', 'image', 'other'], function () {
    return gulp.src(path.resolve(__dirname, 'dist/**/*'))
        .pipe(plumber())
        .pipe(gulp.dest('dist'));
});

// product
gulp.task('product', ['build'], function () {
    connect.server({
        port: 3030,
        root: 'dist'
    });
});

// publish zip
gulp.task('publish', function () {
    let page = args.publish.page ? args.publish.page : '';
    let filePath = path.resolve(__dirname, 'dist/' + (page ? page + '/' : '') + '**/*');
    return gulp.src(filePath)
        .pipe(plumber())
        .pipe(zip((page || 'publish') + '.zip'))
        .pipe(gulp.dest('release'))
});

// clean
gulp.task('clean', ['clean:dist', 'clean:static']);
gulp.task('clean:dist', function () {
    return gulp.src(DIST_PATH, {read: false})
        .pipe(clean({force: true}))
        .pipe(gulp.dest('../dist'));
});
gulp.task('clean:static', function () {
    return gulp.src(OUTPUT_PATH, {read: false})
        .pipe(clean({force: true}))
        .pipe(gulp.dest('../static'));
});

// default
gulp.task('default', ['html', 'js', 'less', 'image', 'other']);
