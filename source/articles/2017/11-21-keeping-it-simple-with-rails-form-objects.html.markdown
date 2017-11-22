---
title: Keeping it Simple With Rails Form Objects
date: 2017-11-21 03:36 UTC
tags: Ruby, Rails, OOP
---

## The Problem

A perennial problem for Rails developers is the explosion in size of controller actions as applications grow. Forms that don't tie directly to a single ActiveRecord model, in particular tend to build up extra cruft in both the view and the controller. Often in this situation business logic and presentation logic will end up mixed into both places. This makes bugs more likely, harder to find, and create code that is resistent to refactoring. Moreover, when Rails developers add forms using `form_tag`, they miss out on the `form_builder` provided by `form_for`, which might seem minor, but can be quite convenient when a select box is needed.

## Form Objects

Form objects are as the name implies objects that are concerned with at least the creation of forms. They are similar in use to other common patterns like Service Objects, Decorators, and other non Rails objects that are commonly used in Rails applications. Form Objects will typically include `ActiveModel::Model` so that `form_for` can be used, and to provide validations, if necessary or desired.

### Using Form Objects

I typically create a `/forms` folder under `/app` to separate my form objects from my database backed ActiveRecord models in `/models`. I've found that this keeps things nicely organized, and its a pattern that other people in the community use, so I have the benefits of using conventions if I work with other people. 

The first object I create is a base from object, that my other Form Objects inherit from. This is similar to the use of `ApplicationRecord` in Rails 5. It allows me to override default behaviors of ActiveModel without having those changes step on code elsewhere in the app or interfere with code coming from an engine or gem.

The simplest base object, located at `app/forms/form_object.rb` looks like this: 

```ruby
  class FormObject
    include ActiveModel::Model
  end
```

If you wanted to change the behavior of `initialize`, `persisted?`, or validations for all forms, you would do so here.

My other form objects inherit from `FormObject`, and will generally define their own initialization. There is a search form in an app I'm working on for a series of blog posts that handles basic setup, pulling in a second model, and offset based pagination. It looks like this: 

```ruby
  class ArticlesSearchForm < FormObject
    attr_accessor :title, :publications, :search_offset

    def initialize(title = '', publications = nil, search_offset = 0)
      @title = title
      @publications = publications ? publications : top_ten
      @search_offset = search_offset
    end

    private

    def top_ten
      Publication.limit(15).pluck(:name).push('')
    end
  end
```
*I've removed the doc lines and some caching logic for brevity, if you would like to view the original, it is available [here](https://github.com/Ch4s3/ink_stream/blob/ab0ffd0b838d6bb441f0b201a1da49436205ace0/app/forms/articles_search_form.rb)*

Consider the following line: 

```ruby
  @publications = publications ? publications : top_ten
```  


It would  be problematic if it were in either the controller or the view. If it were in the controller then you would need to find a place to put the query, or turn the nice ternary into a longer `if...else`. The ternary is nice and concise here an allows us to keep the assignment on one line, so it makes sense to keep that. Now, we could place the query on the model which would be valid, but someone might start using it somewhere else. If that happens, a refactoring could break our search form's select box for publications. So I think keeping this line with the presentation logic makes sense. This is a nice advantage of thr Form Object.

Since all of our logic is packaged together, and we have some sane defaults, we can just initialize the class in our controller for the most basic case. If we had business logic in the future that changed any of those defaults conditionally, we could pass that data into the class and keep our presentation logic cleanly separated. 

You can see the simplicity of the initialization below:

```ruby
  def search
    @articles_search_form = ArticlesSearchForm.new
  end
```
*view the whole file [here](https://github.com/Ch4s3/ink_stream/blob/ab0ffd0b838d6bb441f0b201a1da49436205ace0/app/controllers/articles_controller.rb)*

Now that we have our object in place, we can pass it to a view template that makes use of `form_for`. As you can see, there is no logic in the view, and we can simply fill in the select box with `@articles_search_form.publications`.

```erb
  <%= form_for @articles_search_form, url: {action: "results"}, method: "get" do |f| %>
    <fieldset>
      <%= f.label(:publications)%>
      <%= f.select(:publications, @articles_search_form.publications) %>
      <%= f.label(:title)%>
      <%= f.text_field :title %>
      <%= f.submit "Search", class: "button button-outline" %>
    </fieldset>
  <% end %>
  ```
  *view the whole file [here](https://github.com/Ch4s3/ink_stream/blob/ab0ffd0b838d6bb441f0b201a1da49436205ace0/app/views/articles/search.html.erb)*

  The form used in this view is by the books, and should be easy to maintain, since it only relies on receiving an object that includes `ActiveModel::Model` and has the fields title, and publications. The handling of the form's data on post is similarly straightforward, and uses a Service Object, which I might cover in a later post.

  Hopefully this was a helpful introduction to form objects, and the encapsulation of presentation logic.