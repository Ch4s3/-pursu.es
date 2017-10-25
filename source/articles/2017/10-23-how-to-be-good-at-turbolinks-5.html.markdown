---
title: How to Be Good at Turbolinks 5
date: 2017-10-23 00:46 UTC
tags: Turbolinks, Ruby, Rails, JavaScript, React, Webpacker, Webpack
---

---
### What is Turbolinks

Turbolinks is a JavaScript library that intercepts all clicks on `<a href>` links and makes that request via AJAX and replaces the current page `<body>` with the new body from the AJAX HTML response. This gives server rendered and static html pages the snappy feel of a Single Page Application(SPA). This works well, because normal clicks on Hrefs follow the link and reload the whole page, including all assets and headers. Turbolinks allows you to keep the already loaded resporces in place, which saves a great deal of time when loading a new page. Additionally, Turbolinks makes use of the browser's [History API](https://developer.mozilla.org/en-US/docs/Web/API/History) to change the url, and preserve the functionality of the back button. Depending upon the size of your asset bundle Turbolinks can save 200-700ms on each new page load.

### Some background

Turbolinks is at times a contentious topic among Ruby developers, especially those who worked with
Rails in the early 2010's. Prior to 2014, Turbolinks was rapidly changing and poorly documented. It was a common complaint that Turbolinks would break jQuery plugins, random 3rd party scripts, and JavaScript that relied on clean global scope and a single `.ready()` or `DOMContentLoaded` event. 
The situation has improved dramatically since, and Turbolinks was rewritten and released as 5.0 in June of 2016. The documentation has [improved greatly](https://github.com/turbolinks/turbolinks/tree/v5.0.3#turbolinks) and events have been simplified. Additionally the rise in popularity of JavaScript SPAs has meant that most new JavaScript libraries 
are less likely to rely on clean global cache or `DOMContentLoaded` since SPAs essentially work the
way Turbolinks does *(This is an idea that is perhaps worth revisiting later)*.

### How to use Turbolinks Well

The first major step towards using Turbolinks in an effective manor is to commit to using `turbolinks:load` instead of `.ready()` or `DOMContentLoaded`. This sounds easy, but may require a bit of thought and discipline. You will additionally need to make sure that any code executed during the load event is [idempotent](https://en.wikipedia.org/wiki/Idempotence), meaning htat they may be executed multiple times without changing their results. If you run into a problem with Turbolinks early on, it is most likely due to the execution of code that isn't idempotent during the load event. With those two things in mind, make sure you aren't using third party JavaScript libraries that violate the previous two rules.

#### Getting Started

Althought Turbolinks is associated with Rails, you can install it as a node_module or via a
CDN. If you use a CDN and a script tag as shown below, Turbolinks will initialize itself and you are
all set.

```html
  <head>
    <title>My Cool Site</title>
    <link href="/stylesheets/my_site.css" rel="stylesheet" data-turbolinks-track="reload">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/turbolinks/5.0.3/turbolinks.js"></script>
  </head>
  <body>
    <h1> This is my page</h1>
    <a href="/cat_pics.html">Cat Pics</a>
    <script>
      document.addEventListener('turbolinks:load', function() {
        console.log('Cool, Turbolinks works!')
      })
    </script>
  </body>
```

This example has a few noteworthy elements. As mentioned above, the script tag that pulls in the library from the CDN is all you need to get started. In fact, if you create and `index.html`, a `cat_pics.html`, some css at `my_site.css`, and paste this code into the index page, it should just work when you click on the link. The stylesheet link also has a data attribute `data-turbolinks-track="reload"`, which will reload the body of the page if the asset changes. This is pretty useful if you push out assets and want users to get them right away.

If you're using Turbolinks with Rails and [Sprockets](https://github.com/rails/sprockets-rails), it is included by default with new Rails apps or can be added with the gem, `gem 'turbolinks', '~> 5.0.0'`, and with a require, `//= require turbolinks` in your JavaScript manifest. From there, just rememper the three rules mentioned above.

####With Webpacker and React

Recently I've been using Rails 5.1.4, with [Webpacker](https://github.com/rails/webpacker), in palce of Sprockets, to handle my JavaScript, and have found that Turbolinks still fits well with the Rails model of server rendered HTML, even if you're sprinkling in some react components and using Webpack. If you are starting a new project, and do not need to use old jQuery plugins or frameworks that rely on clean global scope, you can set up Turbolinks and start seeing the benefits with very little work beyond the initial configuration. 

You can start a new project with webpacker and Turbolinks by running:

```bash
  # Assuming 5.1+
  rails new my_cool_cat_pics_app --webpack
  yarn add turbolinks
```

For the sake of simplicaity require and start Turbolinks in the primary pack file, `/app/javascript/packs/application.js` as follows:

```js
  import Turbolinks from 'turbolinks';
  Turbolinks.start();
```

*Normally I would create a folder in `/app/javascript` that contains and `index.js` and import tha in the pack file with `import 'folder_name'`, but that level of organization is unnecessary here.*

And then make sure you are including your Webpack bundle/pack in the head section of your `application.html.erb` after the css.

```erb
  <%= javascript_pack_tag 'application', 'data-turbolinks-track': 'reload', defer: true  %>
```

As mentioned earlier `data-turbolinks-track="reload"` reloads the page if you publish new assets. The `defer: true` attribute causes the pack to download along side the html, but defer evaluation until the html is parsed. This is in contrast to `async: true` this is similar, but interrupts html parsing to execute the script. You can see a nice illustration [here](http://www.growingwiththeweb.com/2014/02/async-vs-defer-attributes.html). Async [currently breaks Turbolinks](https://github.com/turbolinks/turbolinks/issues/281), and shouldn't be used with scripts that require Turbolinks, start it, or depend on `turbolinks:load`. Feel free to use it otherwise along side Turbolinks. This can be a sticking point that's hard to untangle, so be careful with Async and load/ready events. Now that Turbolinks is setup you can add some controllers and views to your app and test it out. If it's working, you should see ajax calls in your browser's devtools under the network tab when you click a link.

If you want to sprinkle in some React, Vue, or even Elm you can do so without throwing out Turbolinks. This is a great solution if you need a few complicated pieces of UI on some pages, but don't want to build an entire SPA. You can run `bundle exec rails webpacker:install:react` to install React, React-Dom and prop-types, or you can do so with yarn. 

Next create a `/components` directory `/app/javascript` and add a `clock.jsx` file like the following example taken and modified from [reactjs.org](https://reactjs.org/docs/rendering-elements.html).

```jsx
  function tick() {
    const element = (
      <div>
        <h1>Hello, world!</h1>
        <h2>It is {new Date().toLocaleTimeString()}.</h2>
      </div>
    );
    document.addEventListener('turbolinks:load', () => {
      const clockDiv = document.getElementById('clock');
      if (clockDiv) {
        ReactDOM.render(element, clockDiv)
      }
    });
  }

  setInterval(tick, 1000);
```

Make sure to add `<div id="clock">` to one of your views. This should just work™. 

Obviously this is a small and contrived example, but as long as you make sure to use 'turbolinks:load', keep your setup idempotent, and check you dependencies, it should scale up to more complex components. You may for example wnat to avoid performing PSOT requests in `componentDidMount()`, but you shouldn't do that anyway. If this article piqued your interest, check out [Turbolinks](https://github.com/turbolinks/turbolinks) for more info, and follow me on [Twitter](https://twitter.com/ChaseGilliam) for future posts about related topics, and some cool Turbolinks tricks I'm working on at the moment.

