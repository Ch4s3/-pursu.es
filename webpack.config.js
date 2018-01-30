"use strict"
const path = require("path")
const webpack = require("webpack")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const cssLoaders = [
  {
    loader: "css-loader",
    options: {
      modules: true,
      minimize: true
    }
  },
  {
    loader: "sass-loader"
  }
]
module.exports = {
  context: __dirname + "/source",
  entry: {
    'main': ['./javascripts/all.js', './stylesheets/site.scss'],
    'triangles': ['./javascripts/triangles.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
      },
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {loader: 'css-loader'},
            {loader: "sass-loader"},
          ]
        })
      },
    ],//end rules
  },
  output: {
    path: __dirname + "/build/",
    filename: "js/[name].bundle.js",
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new ExtractTextPlugin('css/[name].bundle.css'),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      comments: false, // remove comments
      compress: {
        unused: true,
        dead_code: true,
        warnings: false,
        drop_debugger: true
      }
    }),
  ],
};
