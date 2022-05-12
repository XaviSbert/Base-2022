import {src, dest, watch, series, parallel} from 'gulp';
import cssnano from 'cssnano';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify-es';
import changed from 'gulp-changed';
import include from "gulp-html-tag-include";
import webp from "gulp-webp";
import clone from "gulp-clone";
import size from "gulp-size";
import rename from "gulp-rename";
import browserSync from "browser-sync";
import wpPot from "gulp-wp-pot";
import replace from "gulp-replace";
import named from 'vinyl-named';
import webpack from 'webpack-stream';
import del from 'del';
import imagemin from 'gulp-imagemin';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import yargs from 'yargs';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';

var sass = require('gulp-sass')(require('node-sass'));

const path = require('path')
const PRODUCTION = yargs.argv.prod;
const WORDPRESS = yargs.argv.wp;
const PRODUCTIONWP = yargs.argv.prodwp;

// General Config Vars
const config = {
    port: 3000,
    devBaseUrl: 'http://localhost',
    themeName: 'mytheme',
    paths: {
        root: './html/src/',
        html: './html/src/**/*.html',
        scss: './html/src/scss/**/*.scss',
        js: './html/src/js/**/*.js',
        images: './html/src/img/**/*',
        dist: './html/dist/',
        distCSSDir: './html/dist/css/',
        distJSDir: './html/dist/js/',
        distIMGDir: './html/dist/img/',
        wpCssDir: './wp-content/themes/mytheme/css/',
        wpScssDir: './wp-content/themes/mytheme/Scss/',
        wpJsDir: './wp-content/themes/mytheme/js/',
        wpImgDir: './wp-content/themes/mytheme/img/',
        node_modules: './node_modules/'
    },
    files: {
        scssFileSrc: './html/src/scss/main.scss',
        scssFileWP: './wp-content/themes/mytheme/scss/main.scss',
        jsFileSrc: './html/src/js/main.js',
        jsFileSrcWP: './wp-content/themes/mytheme/js/main.js',
        cssFileDist: 'style.css',
        jsFileDist: 'main.js',
        allImages: 'html/src/img/**/*.{jpg,jpeg,png,svg,gif,webp}'
    }
}

export const styles = () => {
    return src(config.files.scssFileSrc)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, postcss([ autoprefixer(), cssnano() ])))
        .pipe(gulpif(PRODUCTION, cleanCss({compatibility: 'ie8'})))
        // Add compatibility
        .pipe(rename(config.files.cssFileDist))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(dest(config.paths.distCSSDir))
        .pipe(server.stream());
}
export const wpstyles = () => {
    return src(config.files.scssFileSrc)
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ autoprefixer(), cssnano() ]))
        .pipe(cleanCss({compatibility: 'ie8'}))
        // Add compatibility
        .pipe(rename(config.files.cssFileDist))
        .pipe(sourcemaps.write())
        .pipe(dest(config.paths.wpCssDir));
}

export const htmlInclude = () => {
    return src(config.paths.html)
        .pipe(include())
        .pipe(dest(config.paths.dist))
}

export const watchForChanges = () => {
    watch(config.paths.scss, styles);
    watch(config.files.allImages, series(images, reload));
    watch(config.paths.html, series(htmlInclude, reload));
    watch(['html/src/**/*', '!html/src/{images,js,scss}', '!html/src/{images,js,scss}/**/*', '!html/src/**/*.html'], series(copy, reload));
    watch(config.paths.js, series(scripts, reload));
    watch("**/*.php", reload);
}
export const watchForChangesWP = () => {
    watch(config.paths.wpScssDir, styles);
    watch(config.paths.wpJsDir, scripts);
}


const server = browserSync.create();

export const serve = done => {
    server.init({
        server: {
            proxy: config.devBaseUrl + config.themeName,
            baseDir: config.paths.dist,
            routes: {
                './node_modules/': 'node_modules'
            }
        }
    });
    done();
}
export const reload = done => {
    server.reload();
    done();
};

export const images = () => {
    const sink = clone.sink() // init sink
    return src(config.files.allImages)
        .pipe(changed(config.paths.distIMGDir))
        .pipe(gulpif(PRODUCTION, imagemin({})))

        .pipe(sink) // clone image
        .pipe(webp()) // convert cloned image to WebP
        .pipe(sink.tap()) // restore original image

        // Set destination
        .pipe(gulpif(PRODUCTION, dest(config.paths.wpImgDir)))
        .pipe(dest(config.paths.distIMGDir))
        // Show total size of images
        .pipe(size({
            title: 'images',
            showFiles: true,
            prettySize: true
        }))
}

export const copy = () => {
    return src(['html/src/**/*', '!html/src/{images,js,scss}', '!html/src/{images,js,scss}/**/*', '!html/src/**/*.html'])
        .pipe(dest(config.paths.dist));
}

export const scripts = () => {
    return src(config.files.jsFileSrc)
        .pipe(named())
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    }
                ]
            },

            mode: PRODUCTION ? 'production' : 'development',
            devtool: !PRODUCTION ? 'inline-source-map' : false,
            output: {
                filename: '[name].js'
            },
        }))
        .pipe(uglify())
        .pipe(dest(config.paths.distJSDir));
}
export const wpscripts = () => {
    return src(config.files.jsFileSrc)
        .pipe(named())
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    }
                ]
            },

            mode: PRODUCTION ? 'production' : 'development',
            devtool: !PRODUCTION ? 'inline-source-map' : false,
            output: {
                filename: '[name].js'
            },
        }))
        .pipe(uglify())
        .pipe(dest(config.paths.wpJsDir));
}

export const compressJs = () => {
    return src('src/js/main.js')
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(dest('dist/js'))
        .pipe(browserSync.stream())
}

export const clean = () => del([config.paths.dist]);

export const compress = () => {
    return src([
        "**/*",
        "!node_modules{,/**}",
        "!bundled{,/**}",
        "!src{,/**}",
        "!.babelrc",
        "!.gitignore",
        "!gulpfile.babel.js",
        "!package.json",
        "!package-lock.json",
    ])
        .pipe(
            gulpif(
                file => file.relative.split(".").pop() !== "zip",
                replace("_themename", config.name)
            )
        )
        .pipe(zip(config.name + '.zip'))
        .pipe(dest('bundled'));
};

export const pot = () => {
    return src("**/*.php")
        .pipe(
            wpPot({
                domain: "_themename",
                package: config.name
            })
        )
        .pipe(dest('/wp-content/languages/' + config.name + '.pot'));
};
export const renamer = () => replace("_themename", config.name);

export const dev = series(clean, parallel(htmlInclude, styles, images, copy, scripts), serve, watchForChanges);
export const build = series(clean, parallel(htmlInclude, styles, images, copy, scripts));
export const wp = series( parallel(wpstyles, wpscripts), watchForChangesWP);
export const buildwp = series( parallel(wpstyles, wpscripts), watchForChangesWP);
export default dev;