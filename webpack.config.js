"use strict";
const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ClosureCompiler = require("google-closure-compiler-js").webpack;
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
    site: "./javascripts/all.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
         exclude: /(node_modules)/,
        loader: "babel-loader",
        query: {
          presets: [
            ["es2015", { loose: true, modules: false }]
          ]
        }
      },
      {
        test: /\.(sass|scss)$/,
        use: [{
          loader: ExtractTextPlugin.extract({
            fallbackLoader: ["style-loader"],
            loader: cssLoaders
          }), //end ExtractTextPlugin loader
        }],
      },
    ],//end rules
  },
  output: {
    path: __dirname + "/build/javascripts",
    filename: "[name].bundle.js",
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new ExtractTextPlugin({
      filename: "../stylesheets/[name].bundle.css",
      disable: false,
      allChunks: true,
    }),
    new ClosureCompiler({
      options: {
        processCommonJsModules: true,
        createSourceMap: true,
        languageIn: "ECMASCRIPT6",
        languageOut: "ECMASCRIPT5",
        compilationLevel: "ADVANCED",
        warningLevel: "QUIET",
      },
    })
  ],
};
