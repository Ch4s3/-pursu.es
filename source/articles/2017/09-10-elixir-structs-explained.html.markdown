---
title: Elixir Strcts Explained
date: 2017-09-10 14:40 UTC
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
or alternatively as maps *(like in elixir)*, symbol tables, or dictionaries.  
Elixir has it's own native map implementation and struct is built directly on top 
of that structure, which is itself build on top of Erlang's [map](http://erlang.org/doc/man/maps.html). This is all to say that structs are an abstraction over associative arrays *(maps)*.

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

First let's have a look at Ruby's hashes, since a lot of developers come to Elixir 
from Ruby, and even for people without Ruby background the syntax is close enough
to pseudo code to get out of the way of the concepts. As you can see below, Ruby hashes 
can be instantiated with curly-braces `{}`, which is a common theme among associative
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

####Clojure####

[Clojure](https://clojure.org/), if you are not familiar, is a lisp built
on top of the JVM, and is very different than Ruby. Like Elixir, Clojure is a 
functional programming language with imutable data structures. This places it in 
sharp contrast with Ruby which is Object Oriented and highly mutable. However,
Clojure much like Elixir allows for the appearance of mutability. This is a useful 
feature when working  with map like data. Specifically it has a immutable values 
which are associated with an  [identity](https://clojure.org/about/state), and 
while values do not change, associations may. You can see this below.

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
hash-map keys. It avoids Ruby's problem of mutable hash keys, but still 
allows a lot of flexibility.

####OCaml####

OCaml is an interesting case, because it is both functional and in places
mutable. It is also a strongly typed language, but infers types so it will have
fewer declarations than Java for example. OCaml has [Hash Tables](https://ocaml.org/learn/tutorials/hashtbl.html) which are mutable and
allow the developer to store multiple pieces of data in the same bucket. This
means that it isn't exactly an associative array, it's an abstraction that goes
in a slightly different direction that the `Struct` we're build up to. In short,
OCaml Hash Tables use a hashing function to place values in buckets, some
buckets(keys) hold multiple values, and the collection of buckets and be resized.
You can read up on Hash Tables [here](https://dev.to/vaidehijoshi/taking-hash-tables-off-the-shelf)[1].

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
signature `list`, that happens to be convenient. OCaml has a built in [Map](https://ocaml.org/learn/tutorials/map.html) which is a lot like a strongly typed 
version of the `Struct`, though you can mix types as well

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
different inputs. Essentially any map gets returned and any other Enumerable
that is properly structured will be converted to a `list`, which is then passed
to Erlang's `:maps.from_list` [function](http://erlang.org/doc/man/maps.html#from_list-1),
which takes a list of key-value tupes(ordered arrays) and builds the underlying
data structure. That structure for small(ish) maps stored as two flat arrays
where `key_array[i]` points to `value_array[i]`. In Erlang 18, large maps are
converted to a HAMT (Hash-Array Mapped Trie) *(described [here](https://medium.com/@jlouis666/breaking-erlang-maps-1-31952b8729e6))*
a structure similar to OCaml's hash-table.

###The Struct###

Now that we have established associative arrays and looked at how they work
similarly, but with their own flavors in different languages we are better
positioned to understand what structs offer in addition to the functionality
of maps, and how they differ significantly from maps.

* establish similarities
* establish differences
* metnion the Access protocol and how its invoked via the __struct__ key
* mention how structs work like records
* discuss advantages


Compile-time checks, dot access, and easily implemented default values all make structs an ideal place to store data in Elixir applications. Struts in Elixir allow the developer to the shape of Map like data and the fields and their types ahead of time. If you are comming from an Object Oriented language, structs will give you functionality similar to calsses that have attributes, simple validation at compile time, and are like the rest of Elixir, immutable. This is useful, because in Functional Programming, code 
will pass around data structures and transform them, and Structs allow developers to think about these structures at a higher level of abstraction. 

Below is an example of a simple struct definition that will be useful for demonstrating the basic functionality, and developed to show additional features as we progress.

```elixir
  defmodule Document do
    defstruct [:title, :body, :author, :notes]
  end 
``` 

If we compile this code, or run it in IEX, we can create a blank document struct.

```elixir
  iex(1)> %Document{}
  %Document{author: nil, body: nil, notes: nil, title: nil}
```

As you can see, each field is represented in the associative array/map and is defaulted to `nil`. Out of the box we also have dot access for each of the fields.

```elixir
  iex(1)> d = %Document{title: "Elixir Structs, For Fun & Profit"}
  %Document{author: nil, body: nil, notes: nil,
  title: "Elixir Structs, For Fun & Profit"}
  iex(2)> d.title
  "Elixir Structs, For Fun & Profit"
```

If you are coming from Ruby, Python, JavaScript or a number of other languages, the dot access for fields on the struct will feel familiar. However if you work in languages with getters and setters, this might be more impressive. This method for accessing fields works on maps as well, but only if the keys are atoms. Structs enforce atoms as keys and
limit the possible keys to those found in the struct's definition. This allows for safer access to the fields, as you know which keys are safe to call. This can be particluarly useful when data comes from users or other systems. To that end, enforcing the presence of some or all of the keys may be useful.

Enforcing keys can be accomplished with the `@enforce_keys` macro.

```elixir 
  defmodule Document do
    @enforce_keys [:title, :body]
    defstruct [:title, :body, :author, :notes]
  end 
```

```elixir
  iex(1)> d = %Document{}
  ** (ArgumentError) the following keys must also be given when building struct Document: [:title, :body]
      (ex_scratch) expanding struct: Document.__struct__/1
      iex:1: (file)
```

Now Elixir will throw a helpful error message if these keys are missing from the struct.

As mentioned previously, the default value for struct fields is `nil`, but you aren't stuct with that. Elixir makes it simple to define
default values for any field. This can be useful when you know ahead of time that a particular field will have a certain value or needs to
be a specific data type.

```elixir
  defmodule Document do
    @enforce_keys [:title]
    defstruct title: nil, body: "", author: %{}, notes: []
  end 
```

```elixir
  iex(1)> d = %Document{title: "Elixir Structs, For Fun & Profit"}
  %Document{author: %{}, body: "", notes: [],
  title: "Elixir Structs, For Fun & Profit"}
 ```

 As you can see in this example, author, body, and notes have default values that suggsest the taype of data they will hold. This is helpful because a partially filled in document struct could be passed to a function that tries to deal with an author or list of notes, and it will be easier to pattern match on an empty author than an empty author or `nil`. In general this is a nice way to avoid having to worry about the `nil` case with respect to your own structs. You may also set a struct's default values to other custom structs, which is a common practice in Elixir.

 ```elixir
  defmodule Author do
    defstruct name: "", dob: nil
    @type t :: %Author{name: String.t, dob: any}
  end

  defmodule Note do
    defstruct text: "", line_number: 0
    @type t :: %Note{text: String.t, line_number: non_neg_integer}
  end

  defmodule Document do
    @enforce_keys [:title]
    defstruct title: nil, body: "", author: %Author{}, notes: []
    @type t :: %Document{title: String.t, body: String.t, author: Author.t, notes: list(Note.t) | []}
  end
```

```elixir
  iex(1)> d = %Document{title: "Elixir Structs, For Fun & Profit"}
  %Document{author: %Author{dob: nil, name: ""}, body: "", notes: [],
  title: "Elixir Structs, For Fun & Profit"}
  iex(2)> d.author
  %Author{dob: nil, name: ""}
```

The above code defines Author and Note structs, creating a blank author for a document if none is supplied. It also defines some 
simple type annotations which can be used by a static analysis tool like [dialyxir](https://github.com/jeremyjh/dialyxir). Since this is
a post about structs, I won't cover typespecs, but you may read about them [here](https://elixir-lang.org/getting-started/typespecs-and-behaviours.html). Generally speaking, data internal to ELixir applications should
be constructed from custom structs when possible. This makes you application easier to reason about, makes your data easier to consume for 
other Elixir applications, simplifies testing and documentation, and makes Elixir's already excellent pattern matching even better.

Assuming the structs listed above, the following code will match on an author's name.

```elixir
  defmodule Books  do
    def name_that_book(%Document{author: %Author{name: "Don DeLillo"}}) do
      IO.puts "White Noise"
    end

    def name_that_book(%Document{author: %Author{name: ""}})  do
      IO.puts "nope"
    end
  end
```

```elixir
  iex(1)> d = %Document{title: "White Noise", author: %Author{name: "Don DeLillo"}}
  %Document{author: %Author{dob: nil, name: "Don DeLillo"}, body: "", notes: [],
  title: "White Noise"}
  iex(2)> Books.name_that_book(d)
  White Noise
  :ok
```

As you can see, Documents can be matches on their author's name which is quite nice. You can achieve something similar with maps,
but structs give additional context to function signatures and can help ensure that all data is accounted for whith at least some sane defaults. This in turn helps with testing because you can narrow your input space to just the structs you have defined and their allowed keys. If you're new to Elixir, or lean heavily on maps, give structs a try, they have some great benefits and require minimal extra work to use.

*[1] My good friend Vaidehi wrote [this](https://dev.to/vaidehijoshi/taking-hash-tables-off-the-shelf) excellent article.*