---
title: Working with the Elixir AST
date: 2018-01-30 16:09 UTC
tags: Elixir, AST
---

An [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) is a tree based data structure that represents the structure of some code. It is abstract because it doesn't capture every concrete detail of the code's specific syntax. Some aspects are capture by the structure of the tree itself and the relationships amongst the nodes. Lisp users will be intimately familiar with the concept, as Lisp's S-Expressions from a tree that is both a syntax tree and the concrete code. AST's are used as intermediate representations of code by parsers and compilers when compiling and executing code.

Elixir's AST is accessible from the language itself without any special tools, which isn't necessarily the case with similar languages. This is useful for understanding how aspects of the language work, and is related to how [macros](https://elixir-lang.org/getting-started/meta/macros.html) work in the language. The Elixir AST represents code using `tuples` with 3 elements: the function name, metadata, and the function's arguments. This forms a tree because `defmodule` is a macro(special function) of [Kernel](https://hexdocs.pm/elixir/Kernel.html#defmodule/2) with the arguments `alias` which is the name, and `do_block` which is the module's code. The AST can be accessed using the Kernel method `quote`, of `Code.string_to_quoted/1` if you want to load a string or read code from a file.

Before getting continuing, consider checking out the [accompanying code](https://github.com/Ch4s3/ex_ast) on GitHub.

Consider the following module from the repo.

```elixir
  defmodule Examples.HttpGetter do
    import SweetXml
    def get do
      HTTPoison.start
      HTTPoison.get!("https://en.wikipedia.org/wiki/Prospect_Park_(Brooklyn)")
      |> body
      |> parse_body
    end

    def body(res) do
      res.body
    end

    def parse_body(body) do
      body |> xpath(~x"//span[text()='Overview']/following::p[descendant-or-self::text()]")
    end
  end
```
*The functionality isn't important, but it has a nice SweetXml example as a bonus*

This module can be turned into an AST by passing it's file to `Code.string_to_quoted/1`.

```elixir
  {:ok, ast} = 
    "lib/examples/http_getter.ex" 
    |> File.read! 
    |> Code.string_to_quoted
```

The AST will look like the following.

```elixir
  {:defmodule, [line: 1],
    [
      {:__aliases__, [line: 1], [:Examples, :HttpGetter]},
      [
        do: {:__block__, [],
        [
          {:import, [line: 2], [{:__aliases__, [line: 2], [:SweetXml]}]},
          {:def, [line: 3],
            [
              {:get, [line: 3], nil},
              [
                do: {:__block__, [],
                [
                  {{:., [line: 4],
                    [{:__aliases__, [line: 4], [:HTTPoison]}, :start]},
                    [line: 4], []},
                  {:|>, [line: 7],
                    [
                      {:|>, [line: 6],
                      [
                        {{:., [line: 5],
                          [{:__aliases__, [line: 5], [:HTTPoison]}, :get!]},
                          [line: 5],
                          ["https://en.wikipedia.org/wiki/Prospect_Park_(Brooklyn)"]},
                        {:body, [line: 6], nil}
                      ]},
                      {:parse_body, [line: 7], nil}
                    ]}
                ]}
              ]
            ]},
          {:def, [line: 10],
            [
              {:body, [line: 10], [{:res, [line: 10], nil}]},
              [
                do: {{:., [line: 11], [{:res, [line: 11], nil}, :body]},
                [line: 11], []}
              ]
            ]},
          {:def, [line: 14],
            [
              {:parse_body, [line: 14], [{:body, [line: 14], nil}]},
              [
                do: {:|>, [line: 15],
                [
                  {:body, [line: 15], nil},
                  {:xpath, [line: 15],
                    [
                      {:sigil_x, [line: 15],
                      [
                        {:<<>>, [line: 15],
                          ["//span[text()='Overview']/following::p[descendant-or-self::text()]"]},
                        []
                      ]}
                    ]}
                ]}
              ]
            ]}
        ]}
      ]
    ]}
  ```

It's interesting to note how the pipe operator (`|>`) is preserved in the abstract representation. You may also note, that the line numbers are preserved in each tuple's metadata. If you are paying close attention to those line number you will notice that Line 7, `|> parse_body` appears first, and encloses lines 6 and 5. That gives you a good sense of how the pipe operator is passing arguments to functions. 

We can also move the opposite direction with `Macro.to_string`.

```elixir
  iex(1)> Macro.to_string(ast)
  "defmodule(Examples.HttpGetter) do\n  import(SweetXml)\n  def(get) do\n    HTTPoison.start()\n    HTTPoison.get!(\"https://en.wikipedia.org/wiki/Prospect_Park_(Brooklyn)\") |> body |> parse_body\n  end\n  def(body(res)) do\n    res.body()\n  end\n  def(parse_body(body)) do\n    body |> xpath(~x\"//span[text()='Overview']/following::p[descendant-or-self::text()]\")\n  end\nend"
```

We can also turn the AST back into code.

```elixir
  Code.eval_quoted(ast)

  {{:module, Examples.HttpGetter,
    <<70, 79, 82, 49, 0, 0, 7, 4, 66, 69, 65, 77, 65, 116, 85, 56, 0, 0, 0, 224,
      0, 0, 0, 23, 26, 69, 108, 105, 120, 105, 114, 46, 69, 120, 97, 109, 112,
      108, 101, 115, 46, 72, 116, 116, 112, 71, ...>>, {:parse_body, 1}}, []}
```
This evaluates the code, which is a module, and loads it in memory. At this point you could call `Examples.HttpGetter.get()` and it would work as expected. 

Moving back to the AST, since it is a regular Elixir data structure, it can be parsed and manipulate by your own code, which can be very powerful. Specifically you can write a parser that walks the tree and uses pattern matching to pluck specific chunks of code and manipulate or evaluate them. You can see an example of this powerful technique in [here](https://github.com/rrrene/credo/blob/v0.8.10/lib/credo/code.ex#L68) in Credo, which is a static code analysis tool for the Elixir.

Of course, this barely scratches the surface, but it should get you started. To learn more about macros, I highly recommend checking out Chris McCord's book [Metaprogramming Elixir](https://pragprog.com/book/cmelixir/metaprogramming-elixir). The official [docs](https://elixir-lang.org/getting-started/meta/macros.html) and [Elixir School](https://elixirschool.com/en/lessons/advanced/metaprogramming/) also have nice articles.

Thanks for reading, and as always, if you have any questions or comments, feel free to reach out to me!
