var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;

function configure(env) {
  const isDevelopmentLocal = env === 'devlocal';
  const isDevelopment = isDevelopmentLocal || env === 'dev';
  const isProduction = !isDevelopment;

  var config = {
    // Enable sourcemaps for debugging webpack's output.
    devtool: isDevelopment ? 'source-map' : 'nosources-source-map',

    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['./node_modules']
    },

    entry: {
        'report-code-coverage': './report-code-coverage',
        'post-pr-comment': './post-pr-comment'
    },

    target: 'node',

    output: {
      path: path.resolve('./dist'),
      filename: '[name]/index.js',
      pathinfo: true
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /\/tests\//,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                // configFileName: './tsconfig.json'
              }
            }
          ]
        }
      ]
    },

    plugins: [
      ...isDevelopment ? [
        new CheckerPlugin()
      ] : [],
      new webpack.LoaderOptionsPlugin({
        debug: isDevelopment,
        minimize: isProduction
      }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(isDevelopment ? 'development' : 'production')
        },
        __DEV__: isDevelopment,
        __DEV_LOCAL__: isDevelopmentLocal
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      ...isDevelopment
        ? [
          new webpack.NamedModulesPlugin()
        ] : [
          /*new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
          })*/
        ]
    ]
  };

  return config;
}

const copySync = (src, dest, overwrite) => {
  if (overwrite && fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
  const data = fs.readFileSync(src);
  fs.writeFileSync(dest, data);
}

const createIfDoesntExist = dest => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
}

copySync('./vss-extension.json', './dist/vss-extension.json');
createIfDoesntExist('./dist/report-code-coverage');
copySync('./report-code-coverage/task.json', './dist/report-code-coverage/task.json');
createIfDoesntExist('./dist/post-pr-comment');
copySync('./post-pr-comment/task.json', './dist/post-pr-comment/task.json');

module.exports = configure;
