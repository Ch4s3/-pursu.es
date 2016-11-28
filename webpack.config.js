'use strict';
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  context: __dirname + "/source",
  entry: {
    site: "./javascripts/all.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: "babel-loader",
          options: { presets: ["es2015"] }
        }],
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          ExtractTextPlugin.extract("css"),
          "css-loader",
          "sass-loader",
        ]
      },

      // Loaders for other file types can go here
    ],
  },
  output: {
    path: __dirname + "/build/javascripts",
    filename: "[name].bundle.js",
  },
  plugins: [
    new ExtractTextPlugin({
      filename: "../stylesheets/[name].bundle.css",
      allChunks: true,
    }),
  ],
};
