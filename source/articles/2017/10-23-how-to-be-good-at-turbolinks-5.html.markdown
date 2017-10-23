---
title: How to Be Good at Turbolinks 5
date: 2017-10-23 00:46 UTC
tags: Ruby, Rails, JavaScript, Turbolinks
---

### What is Turbolinks

Turbolinks is a JavaScript library that intercepts all clicks on `<a href>` links and makes that request via AJAX and replaces the current page `<body>` with the new body from the AJAX HTML response. This gives server rendered and static html pages the snappy feel of a Single Page Application(SPA). This works well, because normal clicks on Hrefs follow the link and reload the whole page, including all assets and headers. Turbolinks allows you to keep the already loaded resporces in place, which save a great deal of time when loading a new page. Additionally, Turbolinks makes use of the browser's [History API](https://developer.mozilla.org/en-US/docs/Web/API/History) to change the url, and preserve the functionality of the back button. Depending upon the size of your asset bundle Turbolinks can save 200-700ms on each new page load.

### Some background

Turbolinks is at times a contentious topic among Ruby developers, especially those who worked with
Rails in the early 2010's. Prior to 2014, Turbolinks was rapidly changing and poorly documented. It was a common complaint that Turbolinks would break jQuery plugins, random 3rd party scripts, and JavaScript that relied on clean global scope and a single `.ready()` or `DOMContentLoaded` event. 
The situation has improved dramatically since, and Turbolinks was rewritten and released as 5.0 in June of 2016. The documentation has [improved greatly](https://github.com/turbolinks/turbolinks/tree/v5.0.3#turbolinks) and events have been simplified. Additionally the rise in popularity of JavaScript SPAs has meant that most new JavaScript libraries 
are less likely to rely on clean global cache or `DOMContentLoaded` since SPAs essentially work the
way Turbolinks does.

### How to use Turbolinks Well

The first major step towards using Turbolinks in an effective manor is to commit to using `turbolinks:load` instead of `.ready()` or `DOMContentLoaded`. This sounds easy, but may require a bit of thought and discipline. You will additionally need to make sure that any code executed during the load event is idempotent, meaning htat they may be executed multiple times without changing their results. If you run into a problem with Turbolinks early on, it is most likely due to the execution of code that isn't idempotent during the load event.

#### Getting Started

Althought Turbolinks is associated with Rails, you can install it as a node_module or simply via a
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

If you're using Turbolinks with rails, it is included by default with new Rails apps or can be added with the gem, `gem 'turbolinks', '~> 5.0.0'`, and with a require, `//= require turbolinks` in your JavaScript manifest.
