/**
 * Gulp 构建配置
 * 将 src/ 下的源码压缩后输出到 dist/mp-debug-sdk/
 */

const gulp = require('gulp');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const del = require('del');
const through2 = require('through2');

// 路径配置
const paths = {
  src: {
    js: 'src/**/*.js',
    wxss: 'src/**/*.wxss',
    wxml: 'src/**/*.wxml',
    json: 'src/**/*.json'
  },
  dist: 'dist/mp-debug-sdk'
};

// 清理 dist 目录
function clean() {
  return del([paths.dist]);
}

// 压缩 JS
function buildJS() {
  return gulp.src(paths.src.js)
    .pipe(terser({
      compress: {
        drop_console: false,    // 保留 console（SDK 本身需要用）
        pure_funcs: [],
        passes: 2
      },
      mangle: {
        reserved: ['wx', 'App', 'Page', 'Component', 'getApp', 'getCurrentPages']
      },
      format: {
        comments: false         // 移除注释
      }
    }))
    .pipe(gulp.dest(paths.dist));
}

// 压缩 WXSS（作为 CSS 处理）
function buildWXSS() {
  return gulp.src(paths.src.wxss)
    .pipe(cleanCSS({
      level: 2,
      compatibility: '*'
    }))
    .pipe(gulp.dest(paths.dist));
}

// 压缩 WXML（自定义压缩，兼容小程序特有语法如 wxs、wx:if 等）
function buildWXML() {
  return gulp.src(paths.src.wxml)
    .pipe(through2.obj(function (file, enc, cb) {
      if (file.isBuffer()) {
        let content = file.contents.toString(enc);
        // 移除 HTML 注释（但保留 WXS 内容中的注释交给 terser 处理不了，这里只移除 WXML 注释）
        content = content.replace(/<!--[\s\S]*?-->/g, '');
        // 压缩多余空白（保留至少一个空格，避免破坏内联元素间距）
        content = content.replace(/\s{2,}/g, ' ');
        // 移除标签之间的空白
        content = content.replace(/>\s+</g, '><');
        // 移除首尾空白
        content = content.trim();
        file.contents = Buffer.from(content, enc);
      }
      cb(null, file);
    }))
    .pipe(gulp.dest(paths.dist));
}

// 复制 JSON（JSON 已经是最小化的，无需压缩）
function buildJSON() {
  return gulp.src(paths.src.json)
    .pipe(gulp.dest(paths.dist));
}

// 监听文件变化
function watch() {
  gulp.watch(paths.src.js, buildJS);
  gulp.watch(paths.src.wxss, buildWXSS);
  gulp.watch(paths.src.wxml, buildWXML);
  gulp.watch(paths.src.json, buildJSON);
}

// 构建任务
const build = gulp.series(clean, gulp.parallel(buildJS, buildWXSS, buildWXML, buildJSON));

exports.clean = clean;
exports.build = build;
exports.watch = gulp.series(build, watch);
exports.default = build;
