require "pry"
require "algoliasearch"
require 'redcarpet'
require 'redcarpet'

module Middleman
  class AlgoliaSync < ::Middleman::Extension
    def initialize(app, options_hash={}, &block)
      env_vars = YAML.load(File.open("secrets.yml").read)
      Algolia.init application_id: env_vars["application_id"],
                   api_key: env_vars["api_key"]
      @algolia_index = Algolia::Index.new("posts")
      @redcarpet = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
      super
    end

    def after_build(builder)
      Dir.glob("source/*.markdown") do |markdown_file|
        markdown_post = File.open(markdown_file).read
        article_meta_data = YAML.load(markdown_post.lines[1..3].join("\n"))
        title = article_meta_data["title"]
        article_link = "/" + title.downcase.tr(" ","-") + ".html"
        tags = article_meta_data["tags"].split(",")
        date = article_meta_data["date"]
        unix_time = Date.parse(date).to_time.to_i
        markdown_body = markdown_post.lines[5..-1].join("\n")
        body_html = @redcarpet.render(markdown_body).tr("\n\n", " ")
        text = Nokogiri::HTML(body_html).text.squeeze(" ")
        post =
          { objectID: Base64.encode64(title),
            title: title, article_link: article_link,
            tags: tags, text: text, date: unix_time }
        begin
          @algolia_index.save_object(post)
        rescue => e
          puts "error: #{e}"
        end
      end
    end
  end
end

::Middleman::Extensions.register(:sync, ::Middleman::AlgoliaSync)
