const fileinclude = require('gulp-file-include');

// Start with domain
// npm run build -- --baseHref=/ProStormRoofing/

let gulp = require('gulp'),
    esbuild = require('gulp-esbuild'),
    sass = require('gulp-sass')(require('sass')),
    browserSync = require('browser-sync').create(),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    del = require('del'),
    autoprefixer = require('gulp-autoprefixer');

function getArgumentValue(name, defaultValue) {
    const argumentWithEquals = process.argv.find(function (argument) {
        return argument.startsWith('--' + name + '=');
    });

    if (argumentWithEquals) {
        return argumentWithEquals.split('=').slice(1).join('=');
    }

    const argumentIndex = process.argv.findIndex(function (argument) {
        return argument === '--' + name;
    });

    if (argumentIndex !== -1 && process.argv[argumentIndex + 1]) {
        return process.argv[argumentIndex + 1];
    }

    return defaultValue;
}

function normalizeBaseHref(value) {
    if (!value) {
        return '/';
    }

    if (value === './') {
        return './';
    }

    return value.endsWith('/') ? value : value + '/';
}

const baseHref = normalizeBaseHref(getArgumentValue('baseHref', '/'));

// Clean URLs for pages
const pageRoutes = {
    about_us: 'about',
    careers: 'careers',
    main: 'main',
    our_projects: 'our-projects',
    services: 'services'
};

// 🧹 CLEAN
gulp.task('clean', function () {
    return del(['.tmp', 'dist']);
});

// 🎨 SCSS
gulp.task('scss', function () {
    return gulp.src([
        'app/scss/style.scss',

        'app/scss/main/main.scss',
        'app/scss/about_us/about.scss',
        'app/scss/careers/careers.scss',
        'app/scss/our_projects/projects.scss',
        'app/scss/services/services.scss'
    ], {
        base: 'app/scss'
    })
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 8 versions']
        }))
        .pipe(rename(function (path) {
            if (path.basename === 'style') {
                path.basename = 'style.min';
            }

            if (path.basename === 'main') {
                path.basename = 'main.min';
            }

            if (path.basename === 'about') {
                path.basename = 'about.min';
            }

            if (path.basename === 'careers') {
                path.basename = 'careers.min';
            }

            if (path.basename === 'projects') {
                path.basename = 'projects.min';
            }

            if (path.basename === 'services') {
                path.basename = 'services.min';
            }

            path.dirname = '';
        }))
        .pipe(gulp.dest('.tmp/css'))
        .pipe(browserSync.reload({ stream: true }));
});

// 📦 CSS LIBS
gulp.task('css-libs', function () {
    return gulp.src([
        'node_modules/normalize.css/normalize.css',
        'node_modules/slick-carousel/slick/slick.css'
    ], {
        allowEmpty: true
    })
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('.tmp/css'))
        .pipe(browserSync.reload({ stream: true }));
});

// 📁 APP CSS
gulp.task('css-files', function () {
    return gulp.src([
        'app/css/**/*.css',
        '!app/css/**/*.min.css'
    ], {
        allowEmpty: true
    })
        .pipe(gulp.dest('.tmp/css'))
        .pipe(browserSync.reload({ stream: true }));
});

// 🎨 CSS ALL
gulp.task('css', gulp.parallel(
    'css-libs',
    'css-files',
    'scss'
));

// 🧩 HTML INCLUDE + CLEAN URL
gulp.task('html', function () {
    return gulp.src([
        'app/*.html',
        'app/pages/**/*.html',
        '!app/components/**/*.html'
    ], {
        base: 'app'
    })
        .pipe(fileinclude({
            prefix: '@@',
            basepath: 'app/',
            context: {
                baseHref: baseHref
            }
        }))
        .pipe(rename(function (path) {
            if (path.dirname === 'pages') {
                const route = pageRoutes[path.basename];

                if (route) {
                    path.dirname = route;
                    path.basename = 'index';
                }
            }
        }))
        .pipe(gulp.dest('.tmp'))
        .pipe(browserSync.reload({ stream: true }));
});

// ⚡ JS BUNDLE
gulp.task('script', function () {
    return gulp.src([
        'app/js/main.js',
        'app/js/main_page/main-page_script.js',
        'app/js/careers_page/careers-page_script.js',
        'app/js/our_projects/our_projects-page_script.js'
    ], {
        base: 'app/js'
    })
        .pipe(esbuild({
            bundle: true,
            format: 'iife',
            sourcemap: true,
            target: ['es2018'],
            define: {
                __BASE_HREF__: JSON.stringify(baseHref)
            }
        }))
        .pipe(gulp.dest('.tmp/js'))
        .pipe(browserSync.reload({ stream: true }));
});

// 📁 JS FILES
gulp.task('js-files', function () {
    return gulp.src([
        'app/js/**/*.js',

        // Entry files are bundled through task "script"
        '!app/js/main.js',
        '!app/js/main_page/main-page_script.js',
        '!app/js/careers_page/careers-page_script.js',
        '!app/js/our_projects/our_projects-page_script.js',

        // Modules should not be copied directly to browser
        '!app/js/global/**/*.js',
        '!app/js/main_page/**/*.js',
        '!app/js/careers_page/**/*.js',
        '!app/js/our_projects/**/*.js',

        // Minified/libs
        '!app/js/**/*.min.js'
    ], {
        allowEmpty: true
    })
        .pipe(gulp.dest('.tmp/js'))
        .pipe(browserSync.reload({ stream: true }));
});

// 📦 JS LIBS
gulp.task('js-libs', function () {
    return gulp.src([
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/slick-carousel/slick/slick.js'
    ], {
        allowEmpty: true
    })
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('.tmp/js'))
        .pipe(browserSync.reload({ stream: true }));
});

// ⚡ JS ALL
gulp.task('js', gulp.parallel(
    'js-libs',
    'js-files',
    'script'
));

// 🖼 IMAGES
gulp.task('images', function () {
    return gulp.src('app/images/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('.tmp/images'))
        .pipe(browserSync.reload({ stream: true }));
});

// 📄 JSON
gulp.task('json', function () {
    return gulp.src('app/json/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('.tmp/json'))
        .pipe(browserSync.reload({ stream: true }));
});

// 🔤 FONTS
gulp.task('fonts', function () {
    return gulp.src('app/fonts/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('.tmp/fonts'))
        .pipe(browserSync.reload({ stream: true }));
});

// 🌐 BROWSER SYNC
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: '.tmp',
            index: 'index.html'
        },
        port: 3000
    });
});

// 👀 WATCH
gulp.task('watch', function () {
    gulp.watch(
        'app/scss/**/*.scss',
        { usePolling: true },
        gulp.series('scss')
    );

    gulp.watch(
        'app/css/**/*.css',
        { usePolling: true },
        gulp.series('css-files')
    );

    gulp.watch([
        'app/*.html',
        'app/pages/**/*.html',
        'app/components/**/*.html'
    ], {
        usePolling: true
    }, gulp.series('html'));

    gulp.watch(
        'app/js/**/*.js',
        { usePolling: true },
        gulp.series('js')
    );

    gulp.watch(
        'app/images/**/*.*',
        { usePolling: true },
        gulp.series('images')
    );

    gulp.watch(
        'app/json/**/*.*',
        { usePolling: true },
        gulp.series('json')
    );

    gulp.watch(
        'app/fonts/**/*.*',
        { usePolling: true },
        gulp.series('fonts')
    );

    console.log('👀 Watching app files...');
    console.log('🔗 baseHref:', baseHref);
});

// 🚀 EXPORT HTML
gulp.task('export-html', function () {
    return gulp.src('.tmp/**/*.html', {
        base: '.tmp'
    })
        .pipe(gulp.dest('dist'));
});

// 🚀 EXPORT CSS
gulp.task('export-css', function () {
    return gulp.src('.tmp/css/**/*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('dist/css'));
});

// 🚀 EXPORT JS
gulp.task('export-js', function () {
    return gulp.src('.tmp/js/**/*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('dist/js'));
});

// 🚀 EXPORT IMAGES
gulp.task('export-images', function () {
    return gulp.src('app/images/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('dist/images'));
});

// 🚀 EXPORT JSON
gulp.task('export-json', function () {
    return gulp.src('app/json/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('dist/json'));
});

// 🚀 EXPORT FONTS
gulp.task('export-fonts', function () {
    return gulp.src('app/fonts/**/*.*', {
        allowEmpty: true
    })
        .pipe(gulp.dest('dist/fonts'));
});

// 🚀 EXPORT ALL
gulp.task('export', gulp.parallel(
    'export-html',
    'export-css',
    'export-js',
    'export-images',
    'export-json',
    'export-fonts'
));

// 🏗 BUILD
gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
        'html',
        'css',
        'js',
        'images',
        'json',
        'fonts'
    ),
    'export'
));

// 🔥 DEFAULT DEV
gulp.task('default', gulp.series(
    gulp.parallel(
        'html',
        'css',
        'js',
        'images',
        'json',
        'fonts'
    ),
    gulp.parallel(
        'browser-sync',
        'watch'
    )
));