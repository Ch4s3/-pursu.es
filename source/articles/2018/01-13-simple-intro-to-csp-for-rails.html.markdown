---
title: Simple Intro to CSP for Rails
date: 2018-01-13 21:35 UTC
tags: Ruby, Rails, Security, CSP
---

Security is in the new a lot recently since the disclosure of the [Spectre & Meltdown](https://meltdownattack.com/) vulnerabilities, so I thought it might be a good time to cover a simple, but often overlooked upgrade to Rails security, CSP. While CSP isn't relate to the headline grabbing security issues of the moment, it is important. CSP, or the HTTP `Content-Security-Policy` response header tells user-agents, browsers, which resources it is allowed to load for a page. This is useful in mitigating [XSS](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting) attacks. Note that I said mitigating, as there is no security silver bullet. I would encourage you to read up on defense in depth. [Rails 5.2](http://weblog.rubyonrails.org/2017/11/27/Rails-5-2-Active-Storage-Redis-Cache-Store-HTTP2-Early-Hints-Credentials/) will ship with some sort of CSP headers [dsl](https://github.com/rails/rails/pull/31162) by default, so I will keep this brief, but if you're stuck on a lower version or won't be upgrading ASAP, this intro will be useful.

#The Secure Headers Gem#

Some folks at Twitter built a gem called [secure_headers](https://github.com/twitter/secureheaders) which does pretty much everything you would want a CSP gem to do. You install it with the usual `gem "secure_headers"` and configure it with an initializer at `config/initializers/secure_headers.rb`, or similar. You can find Sinatra config in the gem's docs, there is a separate gem for other Rack apps, and they provide a [list](https://github.com/twitter/secureheaders#similar-libraries) of similar libraries. A sample config might look like the following snippet.

```ruby
  SecureHeaders::Configuration.default do |config|
    config.cookies = {
      secure: true, # mark all cookies as "Secure"
      httponly: true, # mark all cookies as "HttpOnly"
    }
    config.x_content_type_options = "nosniff"
    config.x_xss_protection = "1; mode=block"
    config.csp = {
      default_src: Rails.env.production? ? %w(https: 'self') : %w(http: 'self' 'unsafe-inline'),
      connect_src: %w(
        'self'
      ),
      font_src: %w(
        'self'
        https://fonts.gstatic.com
      ),
      img_src: %w(
        'self'
        https://res.cloudinary.com
      ),
      script_src: %w(
        'self'
        'unsafe-inline'
        https://*.cloudfront.net)
    }
    # Use the following if you have CSP issues locally with 
    # tools like webpack-dev-server
    if !Rails.env.production?
      config.csp[:connect_src] << "*"
    end
  end
```

With respect to cookies, you shouldn't store sensitive data like passwords in cookies. The `Secure` header ensures that cookies can only be sent over HTTPS, which you should already be using in production. The `HttpOnly` header ensures that cookies can't be read from JavaScript's `Document.cookie` API, which will help mitigate XSS. I'm omitting `SameSite`, as it has a nice default, and is a bit tricky, but [check this out](https://security.stackexchange.com/questions/168365/is-setting-same-site-attribute-of-a-cookie-to-lax-the-same-as-not-setting-the-sa) if you need cookies for something like Intercom. Read more about these headers [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies). 

Setting `x_content_type_options` to "nosniff" prevents [MIME type sniffing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#MIME_sniffing). Preventing MIME sniffing is important if your app allows file uploads, as a malicious user could upload an image with JavaScript hidden in it. This issue mostly effects certain versions of IE.

Most new browsers implement some simple XSS protections that overlaps the functionality of `X-XSS-Protection`, but it's still advisable to enable it for the benefit of users on older browsers. Read about the syntax [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection).

The meat of the config deals with the core `Content-Security-Policy` header config defined by `config.csp = {...}` The `default-src` serves as a fallback for the directives that you define after it, as the name implies it is a default. The ternary used in the example forces https in production, but not in development, which is convenient, and it allows inlining scripts and styles in development which is often useful for development tools.

The `connect-src` directive determines which urls may be loaded by JavaScript on the page. If you are using web sockets or any scripts that connect to 3rd parties, you will need to edit this directive.

Loading fonts and images is pretty straightforward with respect to CSP, and the `font-src`
and `img-src` directives above demonstrate how to use google fonts and images hosted on Cloudinary. If you use similar services or a CDN, you should be ale to use this is a template.

JavaScript is controlled by the `script-src` directive, and it probably has the most profound implications withing the set of directives covered here. Most of a sites XSS risk will be related to how it loads and uses JavaScript. You should generally avoid using `unsafe-eval` unless you know what you're doing. Depending upon your needs and browser target you may use `unsafe-inline` to allow inlining JavaScript in HTML. There is some risk, and you should be informed before using this setting. Check out [this](https://stackoverflow.com/questions/8502307/chrome-18-how-to-allow-inline-scripting-with-a-content-security-policy/38554505#38554505) StackOverflow discussion for more info.

This is a very brief overview of how to set CSP headers for Rails < 5.2 and can be adapted to Sinatra. As with any security settings, you shouldn't copy my snippet directly, and should do a bit more reading, however the Secure Headers gem is relatively simple to use and is a nice security upgrade after you have set up HTTPS. I'll follow up later with an article about Rails 5.2 specifically once it is released.