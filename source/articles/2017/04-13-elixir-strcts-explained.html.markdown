---
title: Elixir Strcts Explained
date: 2017-04-13 14:40 UTC
tags: elixir, computer science, data structures
---

## What Are Elixir Structs & How Do They Relate to Other Key Value Data Structures ##

###Background on Maps###
Elixir has a nice feature in the standard library called
[struct](http://elixir-lang.org/getting-started/structs.html), that provides
a really nice user experience for handling key, value data. If your aren't familiar
with what I mean by key, value data, its simply a data structure where
names/symbols are assigned to pieces of data which can be later accessed by
referring to that name. They work like tables with labeled rows. Now, this is
an overly simplistic explanation, but it's useful in introducing the concept. If
you're interested in a bit of CS background these data structures are referred
to more formally as [Associative Arrays](https://en.wikipedia.org/wiki/Associative_array)
or alternatively as maps *(like in elixir)*, symbol tables, or dictionaries. A
language called [SNOBOL](http://snowball.tartarus.org/) was the first programming
language to include a native associative array, called tables, released in
SNOBOL4, 1962 *[1]*. Elixir has it's own native map implementation and struct
is built directly on top of that structure, which is itself build on top of
Erlang's [map](http://erlang.org/doc/man/maps.html). This is all to say that
structs are an abstraction over associative arrays *(maps)*.

Let's take a quick look at maps in Elixir and a few other languages so that
we have a a frame of reference to build upon. Similar to Elixir, Ruby has
[hashes](http://ruby-doc.org/core-2.4.1/Hash.html), which allow any `Object` t
o be used as a key, generally you would use strings, atoms, or numbers as keys,
but there's no such limitation. However, as a best practice one should not use
a mutable object as a key, because that breaks the associative property of the
data structure. Python has [dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries)
which function similarly, but require immutable keys *(in contrast to Ruby)*.
Both languages are distinct from Elixir in that their maps are mutable. Clojure
offers a map implementation that's immutable like Elixir's map. If you're more
familiar with JavaScript, it has "objects" that are essentially like mutable
associative arrays and structs at the same time. There's a reason JSON has
become the de facto serialization format of the web.

###Maps in Comparison###
####Ruby####
First let's have a look at Ruby's hashes, which as you can see below can be
instantiated with curly-braces `{}`, which is a common theme among associative
arrays.

```ruby
  pry(main)> {}
  => {}
```

As mentioned previously, Ruby will happily accept any object as key, even
another hash.

```ruby
  pry(main)> h = Hash.new
  => {}
  pry(main)> {one: 1}
  => {:one=>1}
  pry(main)> h
  => {}
  pry(main)> test_hash = {h => "ruby hashes are interesting"}
  => {
      {} => "ruby hashes are interesting"
  }
  pry(main)> test_hash[{}]
  => "ruby hashes are interesting"
  pry(main)> test_hash[:color] = "red"
  => "red"
  test_hash[String] = "this is odd"
  => "this is odd"
  pry(main)> test_hash
  => {
                   {} => "wow",
               :color => "red",
      String < Object => "this is odd"
  }
```

As you can see, Ruby is very permissive and checks hash key equality based
on value. You can achieve some cool results if you're willing to play around
with some of the features of Ruby hashes, but I will leave that as an exercise
for the reader who is inclined to dig into Ruby.

####Python####
If you are Python developer, the Ruby example above will probably look
both familiar and a bit alien at the same time. Python is not nearly as open to
the whims of the the developer as Ruby may be. Let's have a look at a similar set
of inputs.

```python
  >>> {}
  {}
  >>> d = {}
  >>> d
  {}
  >>> d = {'one': 1, 'two': 2}
  >>> d
  {'one': 1, 'two': 2}
  >>> d['three'] = 3
  >>> d
  {'one': 1, 'two': 2, 'three': 3}
  >>> d[{}] = 'dict'
  Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
  TypeError: unhashable type: 'dict'
```

As you can see, since `dict` is mutable, it isn't a "hashable" type, and can not
be used as a key, which makes sense. This will save you the pain of finding out
that some mutable key has been changed at runtime and you can no longer access
the value you want. In Ruby, the land of mutable hash keys is inhabited by
dragons.

####Clojure####
[Clojure](https://clojure.org/), if you are not familiar, is a lisp, and built
on top of the JVM, and is in many ways very different than the previous
languages, but it brings us into the domain of functional programming languages
where we also find Elixir. Clojure, much like Elixir allows for the appearance
of mutability. Specifically it has a immutable values which are associated with
an [identity](https://clojure.org/about/state), and while values do not change,
associations may. You can see this below.

```clojure
  > (hash-map)
  {}
  > {}
  {}
  > (def h (hash-map :one 1, :two 2))
  #'sandbox11187/h
  > h
  {:one 1, :two 2}
  > (def h (hash-map :one 1, (hash-map) 2))
  #'sandbox11187/h
  > h
  {{} 2, :one 1}
  > (def h (apply hash-map [:one 1 :two 2]))
  #'sandbox11187/h
  > h
  {:one 1, :two 2}
  > (def a (get h :one))
  #'sandbox16576/a
  > a
  1
  > (def h (hash-map [1 2 3] 1, :two 2))
  #'sandbox16576/h
  > h
  {[1 2 3] 1, :two 2}
```
As you can see, Clojure happily lets you assign a variety of data types as
hash-map keys. It provides more flexibility than Python, while avoiding Ruby's
problem of mutable hash keys.

####OCaml####
OCaml is an interesting case, because it is both functional and in places
mutable. It is also a strongly typed language, but infers types so it will have
fewer declarations than Java for example. OCaml has [Hash Tables](https://ocaml.org/learn/tutorials/hashtbl.html) which are mutable and
allow the developer to store multiple pieces of data in the same bucket. This
means that it isn't exactly an associative array, it's an abstraction that goes
in a slightly different direction that the `Struct` we're build up to. In short,
OCaml Hash Tables use a hashing function to place values in buckets, some
buckets(keys) hold multiple values, and the collection of buckets and be resized.
You can read up on Hash Tables [here](https://dev.to/vaidehijoshi/taking-hash-tables-off-the-shelf)[2].

```ocaml
  # let my_table = Hashtbl.create 34517;;
  val my_table : ('_a, '_b) Hashtbl.t = <abstr>
  # Hashtbl.add my_table "one" "1";
  Hashtbl.add my_table "two" "2";
  Hashtbl.add my_table "two" "two";;
  - : unit = ()
  Hashtbl.find my_table "two";;
  - : string = "two"
  # Hashtbl.find_all my_table "two";;
  - : string list = ["two"; "2"]
```

In practice you can use the Hash Table like a map or dictionary if you pretend
that keys with multiple values have arrays as values. Since they have the type
signature `list`, that happens to be convenient. OCaml has a built in [Map](https://ocaml.org/learn/tutorials/map.html)
which is a lot like a strongly typed version of the `Struct`, which is a
little strict for my taste.

####Elixir####
Maps in Elixir look a lot like hashes in Ruby, and that is no accident, as
José Valim the creator of Elixir heavily borrowed some of the best(arguably)
parts of Ruby's Syntax. You can see this in the following example:

```elixir
  iex(5)> map = %{a: 1, b: 2, c: 3}
  %{a: 1, b: 2, c: 3}
```

As you can see, Elixir has a similarly terse and in my opinion readable syntax.
They are also fairly simple, in the [Rich Hickey sense](https://www.infoq.com/presentations/Simple-Made-Easy)
of being the opposite of complex. At their core, Elixir maps sit directly on top
of the `map` data structure introduced in Erlang 17. The Elixir implementation
or the `new` function can be found [here](https://github.com/elixir-lang/elixir/blob/v1.4.2/lib/elixir/lib/map.ex#L165).

```elixir
  @spec new(Enumerable.t) :: map
  def new(enumerable)
  def new(%{__struct__: _} = struct), do: new_from_enum(struct)
  def new(%{} = map), do: map
  def new(enum), do: new_from_enum(enum)

  defp new_from_enum(enumerable) do
    enumerable
    |> Enum.to_list
    |> :maps.from_list
  end
```

You may pass any `Enumerable` type into the new function, which in Elixir would
be `Map`, `Tuple`, `List`, and of course `Struct`. This implementation makes
of Elixir's pattern matching to provide slightly different implementations for
different inputs. Essentially any `map` get returned and any other Enumerable
that is properly structured will be converted to a `list`, which is then passed
to Erlang's `:maps.from_list` [function](http://erlang.org/doc/man/maps.html#from_list-1),
which takes a list of key-value `tupes`(ordered arrays) and builds the underlying
data structure. That structure for small(ish) `maps` stored as two flat arrays
where key_array[i] points to value_array[i]. In Erlang 18, large `maps` are
converted to a HAMT (Hash-Array Mapped Trie) *(described [here](https://medium.com/@jlouis666/breaking-erlang-maps-1-31952b8729e6))*
a structure similar to OCaml's hash-table.

###The Struct###
Now that we have established associative arrays and looked at how they work
similarly, but with their own flavors in different languages we are better
positioned to understand what structs offer in addition to the functionality
of maps.

compile-time checks, dot method access, and easily implemented default values


*[1]I'll cover SNOBOL in future posts about Natural Language
Processing(NLP).*

*[2] My good friend Vaidehi wrote [this](https://dev.to/vaidehijoshi/taking-hash-tables-off-the-shelf) excellent article.*


* struct https://github.com/elixir-lang/elixir/blob/767f7ee2bb3f91890a629f51a3569468779120c9/lib/elixir/lib/kernel.ex#L1719

* map
https://github.com/elixir-lang/elixir/blob/767f7ee2bb3f91890a629f51a3569468779120c9/lib/elixir/lib/map.ex
