---
title: Ruby Memoization
date: 2018-04-20 03:16 UTC
tags: Ruby, Memoization
---

## Momoization ##

If you are unfamiliar with memoization, it is a technique for improving a program's execution time *(at times other purposes)* by storing the results of expensive function calls and returning the stored value when the function is called with the same inputs. This is a speific form of caching. The technique was first described in 1968 by Donald Michie in the paper [*Memo Functions and Machine Learning*](https://www.cs.utexas.edu/users/hunt/research/hash-cons/hash-cons-papers/michie-memo-nature-1968.pdf). You can learn more from [Wikipedia](https://en.wikipedia.org/wiki/Memoization).

### Ruby's Conditional Assignment Operator ###

Ruby provides the `||=` operator, which is often called the conditional assignment operator, or the "or-equals sign". It can be thought of as a simple memoization operator as well. Assuming `my_shirt ||= get_a_shirt_from_the_closet`, if the variable `my_shirt` points to and object that is "truthy" then sending that object the message `||=`  causes `my_shirt` to return iteself. However, if `my_shirt` is "falsy", then `||=` evaluates the method `get_a_shirt_from_the_closet` and sets the result to the variable `my_shirt` in the present context.

Note that `a ||= b` is not logically equivalent to ` a = a || b`, it can more accurately be described as ` a || a = b`, as long as `a` is a bound variable. The `||=` operator may also be used to bind the result of the right hand side to an unbound variable on the left hand side.

This works quite well when `get_a_shirt_from_the_closet` takes no arguments and is otherwise idempotent. If however, you expect to pass arguments to the mothod, or get different results at different times, based on the lastest data from a database for example, then `||=` will keep returning stale data.

### Hash Based Memoization ###

Another strategy for memoization in ruby is to use a hash to store values, which is useful when you have both expensive computations and wnat to pass arguments to the method that is performing the work. Consider the following code.

```ruby
  class Fib
    def initialize
      @answers = {}
    end

    def cached(n)
      @answers[n]
    end

    def fibonacci(n)
      return n if n <= 1
      @answers[n] ||= (fibonacci(n - 1) + fibonacci(n - 2))
    end
  end
```

On initialization, the class creates an empty hash that will be used to store previously computed values. When `Fib.fibonacci(n)` is called for `n` greater than the base cases of `(0,1)`, the method first checks `@answers[n]`, to see if `fibonacci(n)` has already been computed. This is a perfectly good use of memoization, but this implementation is a recursive approach to calculating the fibonacci number, so there's an added twist. If `n` hasn't been pre-calculated, but `n - 1` or `n - 2` have been, those recursive calls return memoized values. If neither is memoized, then the function keeps recursively doing work until it hits a previously calculated value. This approach has the advantage of becoming faster over time, with the tradeoff that it requires O(n) space.

###A Word About Caching###

This type of memoization is a simple and unsophisticated approach to caching. If you want to persist data across time, servers, http requests or something similar, you should be using a more robust caching solution. Rails now comes with a really nice [built in caching layer](http://guides.rubyonrails.org/caching_with_rails.html), and there are a number of gems availale for caching like [Redis-Store](https://github.com/redis-store/redis-store).


###In Closing##
If you need to store the calculations performed by an idempotent method that will get reused within a class, then consider using the `||=` operator. If you need to cache for multiple values, then a hash may be appropriate. However, if you have more complicated needs, then use a purpose built caching solution.


Further Reading:

Peter Cooper's [*What Ruby’s ||= (Double Pipe / Or Equals) Really Does*](http://www.rubyinside.com/what-rubys-double-pipe-or-equals-really-does-5488.html)

Justin Weiss' [*4 Simple Memoization Patterns in Ruby*](https://www.justinweiss.com/articles/4-simple-memoization-patterns-in-ruby-and-one-gem/)

David Fayram's excellent [*
Rubyists Already Use Monadic Patterns
*](http://dave.fayr.am/posts/2011-10-4-rubyists-already-use-monadic-patterns.html)