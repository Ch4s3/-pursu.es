---
title: HTTP/2 Today with Phoenix
date: 2018-01-29 01:58 UTC
tags: Elixir, Phoenix, Http2, Cowboy, Plug, Webpack
---

As you may know, the [IETF](http://www.ietf.org/)’s [HTTP Working Group](https://httpwg.github.io/) has released a new version of the HTTP standard, [HTTP/2](https://http2.github.io/). The new standard is binary, fully multiplexed, and supports server push. The standard was approved in February of 2015, and now [almost all](https://caniuse.com/#feat=http2) modern browsers support it, so you should be able to use it for new projects that don't target IE versions lower than 11. Unfortunately outside of NGINX, and some CDNs server side support has been lagging in many language ecosystems. However, the master branches of Cowboy2 and Plug have supported the standard since November of 2017. It requires a bit of effort, but you can get started with HTTP/2 in a new Phoenix app today.

Back in December [Maarten Van Vliet](https://maartenvanvliet.nl/) posted an nice [article](https://maartenvanvliet.nl/2017/12/15/upgrading_phoenix_to_http2/) describing how to do the minimal setup for a new app. I'll be expanding on that here and explaining how to use Webpack to split you assets to take advantage of HTTP/2 multiplexing.

##Getting Started##

Let's quickly start a new phoenix project.

```bash
  mix phx.new --no-brunch --no-ecto http_2_today
```

We'll be omitting ecto for simplicity, and brunch so that we can add Webpack. We'll be using Webpack, because Brunch doesn't do code splitting, which is useful for creating a number of small files which can be pushed to the client in parallel. Webpack also allows async loading, which can be useful for grabbing assets as you need them and can be combined with HTTP/2 in interesting ways.

Next, lets update our `mix.exs` file to use the versions of Cowboy, Phoenix, and Plug that support HTTP/2.

```elixir
  defp deps do
    [
      {:phoenix, git: "https://github.com/phoenixframework/phoenix", branch: "master", override: true},
       {:plug, "1.5.0-rc.1", override: true},
      {:phoenix_pubsub, "~> 1.0"},
      {:phoenix_html, "~> 2.10"},
      {:phoenix_live_reload, "~> 1.0", only: :dev},
      {:gettext, "~> 0.11"},
      {:cowboy, "~> 2.1", override: true},
    ]
  end
```

Plug 1.5 should be out soon, and for the moment you can use 1.5.0-rc.1. Cowboy 2.1 is stable and simple require overriding the Phoenix default as with Plug. Phoenix is targeting support with updated defaults in 1.4 and there is no release candidate at the time of writing this post, so you'll need to target the master branch for now.

Run `mix deps.get` and then check to make sure that `mix phx.server` works. Everything should be running and ok at this point.

Now let's quickly set up webpack and add some simple JavaScript and CSS. I'll assume you have yarn installed, and are loosely familiar with it, and if not check their [site](https://yarnpkg.com) for details.

First create an `assets/` folder at the top level of  your project. Then move to that directory and begin adding Webpack.
 
 ``` bash
  mkdir assets
  cd assets
  yarn add webpack webpack-dev-server --dev
  yarn add phoenix
 ```

This will create a `package.json` file, a `yarn.lock` file, and a `node_modules/` directory. Now let's add a few more dependencies relates to ES6 transformation and handling Sass. 

```bash
  yarn add babel-core babel-loader babel-preset-env css-loader extract-text-webpack-plugin node-sass sass-loader style-loader --dev
```

If you're coming form brunch, of Phoenix without a front-end build tool, this looks like a lot of impenetrable stuff, but it all boils down to turning new JavaScript features and Sass into something the majority of browsers can handle.

##Webpack Config & Assets##

Now let's create a simple(ish) webpack config file that will get us started.

```
  touch webpack.config.js
```
Next we'll work on a config that will process top level files in `/js` and `/css` as well as splitting out `phoenix_html` lib into a vendor bundle. Vendoring is a great way to take advantage of caching and our case multiplexing. I won't dwell on this too much as Webpack 4, which is in RC changes vendoring a bit and removes the `CommonsChunkPlugin`. The following setup also assumes you'll be using some sort of jsx files, but you could easily use `.vue` or something else.

```javascript
  const webpack = require("webpack");
  const ExtractTextPlugin = require('extract-text-webpack-plugin')
  const path = require('path');

  module.exports = {
    entry: {
      'app': ['./js/app.js', './css/app.scss'],
      'vendor': [
        'phoenix'
      ]
    },
    output: {
      path: path.resolve(__dirname, '../priv/static/js'),
      filename: '[name].js'
    },
    devtool: 'source-map',
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.(sass|scss)$/,
          include: /css/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {loader: 'css-loader'},
              {loader: "sass-loader"},
            ]
          })
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: [
            'babel-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new ExtractTextPlugin('css/app.css'),
      new webpack.optimize.CommonsChunkPlugin({name: 'vendor'})
    ],
  };
```

###Babel###

Next let's add a `.babelrc` file, so that we can use babel and store it's config seperately from webpack.

```
  touch .babelrc
```
Then set it to use the `env` preset, which should be adequate for most users.

```javascript
  {
    "presets": ["env"]
  }
```

###The Javascript##

For now, let's just create a folder and a simple entry point.

```bash
  mkdir js
  touch js/app.js
```

Now in the js file, let's import the Phoenix sockets code.

```javascript
  import { Socket } from 'phoenix';
```

This is fine to start with, and will let us see if things are working as intended.

###Some Sass/Scss###

Similar to the above JavaScript, we'll create an entry point file and I'll be using Scss syntax for Sass.

```bash
  mkdir css
  touch css/app.scss
  touch css/normalize.css
```
Go to the Normalize [github page](https://github.com/necolas/normalize.css) and copy the latest version and paste it into your new `normalize.css` file. Then include that in you `app.scss` file.

```sass
  @import "normalize.css";
```

This will bundle up normalize, and you can use the same pattern for your own css/scss/sass files.

###Configuring the Start Script###

This is a good time to configure a simple start script for `webpack-dev-server`. Open you `package.json` and add the following snippet.

```javascript
  "scripts": {
    "start": "webpack-dev-server --https --color --compress"
  },
  ```
Now when you run `yarn start` inside of `assets/` you will spin up a dev server that will serve asstes over https which is necessary for HTTP/2, it will colorize it's output, and gzip everything. If `yarn start` works, then you're ready to jump back to the Phoenix portion of the app and configure things there.

###Phoenix Configuration###

First, we need to generate a private key and self signed certificate so that Cowboy and Phoenix can serve you application over https locally. The following is taken directly the section in `config/dev.exs` about SSL.

```bash
  openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" -keyout priv/server.key -out priv/server.pem
```

You'll want to add the following to your `.gitignore`, as you should never store sensitive information or credentials in you source control.

```
  priv/server.key
  priv/server.pem
```

Now let's configure our endpoint to server our app over https and run a watcher for `webpack-dev-server`. Add the following to your `config/dev.exs`.

```elixir
  config :http_2_today, Http2TodayWeb.Endpoint,
    debug_errors: true,
    code_reloader: true,
    check_origin: false,
    watchers: [
      node: [
        "node_modules/.bin/webpack-dev-server",
        "--https",
        "--color",
        "--inline",
        "--hot",
        "--stdin",
        "--host", "localhost",
        "--port", "8080",
        "--public", "localhost:8080",
        "--config", "webpack.config.js",
        cd: Path.expand("../assets", __DIR__)
      ]
    ],
    https: [port: 4000, keyfile: "priv/server.key", certfilee: "priv/server.pem"]
```
You should now be able to run `mix phx.server` from you main directory and see Webpack output in the console.

At this point, we need to make sure we can include our assets in out html templates.

####View Functions####

Add the following functions to `lib\http_2_today_web\views\layout_view`.

```elixir
  defmodule Http2TodayWeb.LayoutView do
    use Http2TodayWeb, :view
    def js_script_tag do
      if Mix.env == :prod do
        # In production we'll just reference the file
        """
          <script src="<%= static_path(@conn, "/js/vendor.js") %>"></script>
          <script src="<%= static_path(@conn, "/js/app.js") %>"></script>
        """
      else
        # In development mode we'll load it from our webpack dev server
        """
          <script src="https://localhost:8080/vendor.js"></script>
          <script src="https://localhost:8080/app.js"></script>
        """
      end
    end

    # Ditto for the css
    def css_link_tag do
      if Mix.env == :prod do
        "<link rel=\"stylesheet\" href=\"<%= static_path(@conn, \"/css/app.css\") %>" 
      else
        "<link rel=\"stylesheet\" type=\"text/css\" href=\"https://localhost:8080/css/app.css\" />"
      end
    end
  end
```

This will load assets from the dev server in dev mode and server the bundled files in production. Now we can use these function in `lib/http_2_today_web/templates/layout/app.html.eex`.

```erb
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="">
      <meta name="author" content="">

      <title>Hello Http2Today!</title>
      <%= {:safe, css_link_tag()} %>
    </head>

    <body>
      <div class="container">
        <header class="header">
          <nav role="navigation">
            <ul class="nav nav-pills pull-right">
              <li><a href="http://www.phoenixframework.org/docs">Get Started</a></li>
            </ul>
          </nav>
          <span class="logo"></span>
        </header>

        <p class="alert alert-info" role="alert"><%= get_flash(@conn, :info) %></p>
        <p class="alert alert-danger" role="alert"><%= get_flash(@conn, :error) %></p>

        <main role="main">
          <%= render @view_module, @view_template, assigns %>
        </main>

      </div> <!-- /container -->
      <%= {:safe, js_script_tag()} %>
    </body>
  </html>
```

### Trying It Out###

Now, let's put it all together and check it out in the browser. Run `mix phx.server` and visit [https://localhost:4000](https://localhost:4000) in your favorite browser. You'll probably have to tell the browser at this point to trust your self-signed cert, and you'll need to visit [https://localhost:8080/](https://localhost:8080/) and do the same for the assets host. If that worked you should be able to open the inspector, switch to the network tab, and see that everything is loading over HTTP/2.

![inspector view](https://res.cloudinary.com/dbwkpvbdo/image/upload/q_auto:good/v1517201192/inspector_h2.png)


Notice under protocol, all of the assets are marked h2, which is shorthand for HTTP/2.

###Wrap Up###

This should give you enough to start working with HTTP/2 and actual assets. I'll leave it as an exercise for readers to explore pushing multiple js files to the client and combining Webpack's lazy loading to push files on demand. In production, you will need to generate real certs and configure `prod.exs`, but that's out of the scope of this post. As always, if you have any questions, feel free to reach out and ask me.

You can find the full source code [here](https://github.com/Ch4s3/http_2_today).