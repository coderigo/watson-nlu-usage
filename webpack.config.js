/*jshint esversion: 6 */

const webpack = require('webpack');
const nodeEnv = process.env.NODE_ENV || 'production';

module.exports = {
    default: {
        target: 'node',
        devtool: 'source-map',
        entry: './src/WatsonNLUUsage.js',
        output: {
            filename: './dist/WatsonNLUUsage.js',
            library: 'WatsonNLUUsage',
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        module: {
            loaders: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: [ 'babel-preset-es2015' ]
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
              'proccess.env': { NODE_ENV: JSON.stringify(nodeEnv) },
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: { warnings: false },
                output: { comments: false },
                sourceMap: true
            }),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        ],
        node: {
            console: true,
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            ws: 'empty'
        }
    }
};
