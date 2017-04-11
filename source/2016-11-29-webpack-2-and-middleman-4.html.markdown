---
title: Webpack 2 and Middleman 4
date: 2016-11-29 14:57 UTC
tags: webpack, middleman, javascript
---

### A quick guide to using Webpack 2 with Middleman 4

*I originally wrote this Nov. 29th, 2016 before Webpack 2 was out of beta, so I
mostly re wrote it, including new gists, etc on Apr. 10th, 2017*

As of version 4, Middleman now supports a variety of front-end/JS tooling via
the External Pipeline, outlined [here](https://middlemanapp.com/advanced/external-pipeline/). Previously Middleman only built assets via Rails' venerable Asset Pipeline aka [Sprockets](https://github.com/rails/sprockets-rails). There is a lot that could
be said about Sprockets and why it may or may not be a good choice for Middleman
going forward, but even the core Rails team is building in a way to integrate new
JS tools like Webpack *[edit as of 3/17]*, and its clear which way the wind is
blowing. Having run a previous blog iteration and some clients' sites on
Middleman I'm pretty familiar with it, and I generally think the folks at
[thoughtbot](https://thoughtbot.com/) have done a nice job. If I had more
serious content management needs, I also like Jekyll a lot. Finally I use Webpack
at work and think the people behind it are all mighty nice, so I decided to go
that direction for the New & Shiny™ blog.

The example from the Middleman docs looked simple enough, it basically just
involved throwing the snippet below into the `config.rb`

```ruby
  activate :external_pipeline,
    name: :webpack,
    command: build? ? './node_modules/webpack/bin/webpack.js --bail' : './node_modules/webpack/bin/webpack.js --watch -d',
    source: ".tmp/dist",
    latency: 1
```


If you're thinking to yourself, "surely it can't be that simple" then you would
be correct. From there you still need to set up your `webpack.config.js`, which
isn't hard per se, but there's a lot of room for frustration and errors. This is
doubly true if you aren't a JS developer or are new to Webpack. I had a lot of
trouble setting up `extract-text-webpack-plugin` and ultimately had to reach
out to the chronically delightful [Sean Larkin](https://twitter.com/TheLarkInn)
for help.

I also used a [blog post](https://rossta.net/blog/using-webpack-with-middleman.html) by Ross Kaffenberger for reference. he uses Webpack 1, and his blog setup is worth
looking at in general. Here's a like to his [site's github](https://github.com/rossta/rossta.github.com) His `webpack.config.js` is
at the top level and looks a bit different than the one I'll show below, as it's
for a different version of Webpack, so don't mix them up! I'm also using [Yarn](https://yarnpkg.com/en/) instead of npm, because I like the `lockfile`.

So starting from the beginning, I'll assume you have Ruby installed, and if not
go [here](https://www.ruby-lang.org/en/documentation/installation/) and make
sure you have a working Ruby.

####Install Middleman 4 and Start a Project####

There are some simple instructions [here](https://middlemanapp.com/basics/install/),
but it pretty much boils down to running `gem install middleman`. Once it's done
installing you should be able to run `middleman init my_new_project` and start a
new project. You will also need to install [Node](https://nodejs.org/en/download/)
and [Yarn](https://yarnpkg.com/en/docs/install). If that all worked, congrats
you're ready to go, and you may have [broken the bubble](https://en.wikipedia.org/wiki/Bingo_(U.S.)#Terminology) on your bingo card.

Next `cd my_new_project`, and start a new yarn project:

` yarn init`

Just use all of the defaults by hitting enter until it's done, they should all
be fine. Fore reference, [here](https://github.com/Ch4s3/webpack_middleman_blog_sample/tree/435f3a88352d9b2a804254c3d9c7a0be38e76302) is what my demo repo looked like at this point. Next you'll need to
install a few packages.

`yarn add --dev webpack webpack-dev-server@2`

This installs Webpack

`yarn add --dev babel-loader babel-core babel-preset-es2015`

and this adds [Babel](https://babeljs.io/), a JS transpiler.

`yarn add --dev css-loader extract-text-webpack-plugin sass-loader style-loader`

Finally, this installs all of the things you need to do regular CSS and [SASS](http://sass-lang.com/).

Don't forget to activate the `external_pipeline` by adding the following to `config.rb`

```ruby
  activate :external_pipeline,
    name: :webpack,
    command: build? ?
    "./node_modules/webpack/bin/webpack.js --bail -p" :
    "./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
    source: "build",
    latency: 1
```

You'll notice this is a little different than the initial example, basically I'm
just using a build directory and adding color to the Webpack output.

Now run `touch webpack.config.js` and add the following:

```javascript
  "use strict";
  const path = require("path");
  const webpack = require("webpack");
  const ExtractTextPlugin = require("extract-text-webpack-plugin");
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
      site: "./javascripts/site.js",
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
            use: "css-loader"
          })
        },
      ],//end rules
    },
    output: {
      path: __dirname + "/build/javascripts",
      filename: "[name].bundle.js",
    },

    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new ExtractTextPlugin({
        filename:  (getPath) => {
          return getPath("[name].bundle.css").replace("css/js", "css");
        },
        disable: false,
        allChunks: true,
      }),
    ],
  };
```
<a href="https://gist.githubusercontent.com/Ch4s3/cdb399bf439bc85ce9b735e005b66686/raw/76af0fbb0ec1bd0ba76e0f1b6b5d5e42f911c7a2/demo_webpack.config.js" target="_blank">Here
</a> is a raw gist for easy copying. *Warning: opens new tab*

The lines beginning with `test: /\.(sass|scss)$/,` make the sass work, and these lines are basically straight from the `extract-text-webpack-plugin` [readme](https://github.com/webpack-contrib/extract-text-webpack-plugin/tree/v2.1.0).

If you run `middleman`, everything should basically work, and you should see
something like the following:

```
  == The Middleman is loading
  == Executing: `./node_modules/webpack/bin/webpack.js --watch -d --progress --color`
  == View your site at "http://YOUR_ROUTER_NAME:4567", "http://YOUR_IP:4567"
  == Inspect your site configuration at "http://YOUR_ROUTER_NAME.home:4567/__middleman", "http://YOUR_IP:4567/__middleman"
    0% compiling== External: Webpack is watching the files…
  == External: Hash: 57c5cbdd1ea73e6cd381
  == External: Version: webpack 2.3.3
  == External: Time: 610ms
  == External:          Asset    Size  Chunks             Chunk Names
  == External: site.bundle.js  3.2 kB       0  [emitted]  site
  == External:    [0] ./javascripts/site.js 31 bytes {0} [built]
```

If that worked, you're all set. If it didn't go back and make sure all of your
config and versions match. And for reference [here](https://github.com/Ch4s3/webpack_middleman_blog_sample/tree/4d735620f8f78da12005703131be3eaf655dc4f3) is my repo at his point. Webpack may be overkill if you don't do JS or
if you only want to use vanilla JS and CSS, but if you want to use es6 or SASS,
like me, then its probably worth the effort. If you'd like to see this blog's
source, it's [here](https://github.com/Ch4s3/-pursu.es) on Github.

If you would like to learn more about Webpack, they have a great [tutorial](https://webpack.js.org/guides/get-started/) and docs.
