---
title: Form Objects in Rails 5.1
date: 2017-09-14 04:00 UTC
tags: ruby, rails, oop
---

There is a tendancy among newer developers using Rails to place all of their functionality in controllers
until they discover the Fat Controller Anti-Pattern. This will often be discovered organicically oncne 
a controller becomes a giant ball of mud, that is inscrutable and untestable. If these same developers have the benefit of good code review, helpful friends, or develop their googling skills they may then discover
the so called Fat Model, Skinny Controller principle. This will certainly ben an improvement. However,
over time models may become so fat that the developer finds a familiar problem; classes that are giant
balls of mud. This problem is pretty well understood in the community, but the practice of moving business
logic to distinctly namespaced modules outside of `app/models` isn't as widespread as it should be.

In this article I'm going to discuss as strategy for pulling some logic out of controllers and into form
objects. After enough time writing web applications with Rails, you will eventually write some forms that don't make use of ActiveRecord models. The convenience of `form_for` is lost and logic may be spread across 
any number of controller actions, filters, and objects. 

Run 
```bash
  rails new ink_stream --database=postgresql --webpack -T
```