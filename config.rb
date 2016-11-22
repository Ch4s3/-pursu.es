###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

# With alternative layout
# page "/path/to/file.html", layout: :otherlayout

# Proxy pages (http://middlemanapp.com/basics/dynamic-pages/)
# proxy "/this-page-has-no-template.html", "/template-file.html", locals: {
#  which_fake_page: "Rendering a fake page with a local variable" }

# General configuration
activate :external_pipeline,
  name: :brunch,
  command: build? ? './node_modules/brunch/bin/brunch build --production --env production' : './node_modules/brunch/bin/brunch watch --stdin',
  source: "priv/static",
  latency: 1
###
# Helpers
###

configure :development do
  activate :livereload
end

activate :blog do |blog|
  blog.permalink = "{category}/{year}/{month}/{day}/{title}.html"
end

# Methods defined in the helpers block are available in templates
# helpers do
#   def some_helper
#     "Helping"
#   end
# end

# Build-specific configuration
configure :build do
end
