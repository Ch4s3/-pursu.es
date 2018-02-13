---
title: Protobuf in Elixir with Exprotobuf
date: 2018-02-11 01:30 UTC
tags: Elixir, Protobuf, Plug
---

##What is Protobuf##

Protobuf, or protocol buffers are at their core a means of serializing structured data. Protocol buffers occupy a use case where XML was dominant in the past and where JSON is lacking, passing structured data between systems. Compared to XML, protobuf is a much simpler standard, binary, an order of magnitude smaller, up to two orders of magnitude faster to serialize/deserialize, and [claims to have other benefits](https://developers.google.com/protocol-buffers/docs/overview#whynotxml). You might consider protobuf when sending things like structured logging data to other servers, if you are working with [gRPC](https://grpc.io/docs/), or if you want clients to be able to generate code to consume your api.

##Protobuf in Elixir##

There are a couple of options for working with protobuf in Elixir, with [exprotobuf](https://github.com/bitwalker/exprotobuf), being the easiest to get started with, and [protobuf-elixir](https://github.com/tony612/protobuf-elixir) being more full featured nd standards compliant. I ended up choosing exprotobuf for this article because I got it working first and didn't have to install the protobuf compiler. That said, I would probably use protobuf-elixir because it supports code generation and doesn't rely on string templates. It also doesn't rely on the Erlang library [gpb](https://github.com/tomas-abrahamsson/gpb), though I'm not sure how much I care about that. I'll probably write a future version of the following guide targeting protobuf-elixir if there is sufficient interest.

##Getting Started##

The simple mix application for this guide provides an api for reading/creating [MegaMan](https://en.wikipedia.org/wiki/Mega_Man) androids. It was a completely frivolous choice, but I didn't want to track down a logging service that supports protobuf, and I really dislike code example that uses blog posts, comments, or address books. Those things seem to carry a lot of mental baggage for me, and I like to model other data when learning new tools. You can find the Github repo [here](https://github.com/ch4s3/proto_man).

First let's spin up a new mix app with a supervisor so that we can run a client and server from `iex`.

```bash
  mix new proto_man --sup
```
This will generate the usual structure, but with an `application.ex` that gives you a bare bones [supervisor](https://hexdocs.pm/elixir/Supervisor.html).

Next, let's install [Cowboy](https://github.com/ninenines/cowboy), [Plug](https://github.com/elixir-plug/plug), and [HTTPoison](https://github.com/edgurgel/httpoison), so that we can make and serve requests. Add the following to `mix.exs`.

```elixir
    defp deps do
      [
        {:cowboy, "~> 1.1.2 "},
        {:httpoison, "~> 1.0"},
        {:plug, "~> 1.5.0-rc.1"}
      ]
    end
```

After running `mix deps.get`, we will create a simple router module to serve responses to requests.

```elixir
  defmodule ProtoMan.Router do
    use Plug.Router
    plug :match
    plug :dispatch

    get "/androids" do
      send_resp(conn, 200, "this will return androids soon")
    end

    post "/androids" do
      send_resp(conn, 501, "nothing to post to yet")
    end

    match _ do
      send_resp(conn, 404, "oops")
    end
  end
```
*There is a correction as of 2/13/18 in the post function, the original version was missing the conn arg.*

Next, let's register this with the supervisor in `lib/proto_man/application.ex` 

```elixir
  defmodule ProtoMan.Application do
    # See https://hexdocs.pm/elixir/Application.html
    # for more information on OTP Applications
    @moduledoc false

    use Application

    def start(_type, _args) do
      # List all child processes to be supervised
      children = [
        Plug.Adapters.Cowboy.child_spec(:http, ProtoMan.Router, [], [port: 4001])
      ]

      # See https://hexdocs.pm/elixir/Supervisor.html
      # for other strategies and supported options
      opts = [strategy: :one_for_one, name: ProtoMan.Supervisor]
      Supervisor.start_link(children, opts)
    end
  end
```

##Adding a Protocol Buffer Message##

Now, if you run `iex -S mix` you should be able to run `curl http://localhost:4001/androids` in another terminal tab and get a response. This is a good time to start working with the actual protocol buffers for our app. Create an `Androids` submodule in `lib/proto_man` that looks like the following.

```elixir
  defmodule ProtoMan.Androids do
    use Protobuf, """
      message Android {
        message Health {
          required uint32 value = 1;
        }
        enum SpecialWeapon {
          MegaBuster = 0;
          AtomicFire = 1;
          ProtoShield = 2;
          AtomicFire = 3;
          DrillBomb = 4;
        }
        enum Version {
          V1 = 1;
          V2 = 2;
        }
        required string name = 1;
        required SpecialWeapon special_weapon = 2;
        required Version version = 3;
        optional Health hp = 4;
      }
    """

    def safe_decode(bytes) do
      try do
        {:ok, ProtoMan.Androids.Android.decode(bytes)}
      rescue
        ErlangError ->
          {:error, "Error encoding data"}
      end
    end
  end
```

If you are using the excellent [ElixirLS](https://github.com/JakeBecker/elixir-ls) (Elixir language server) for vscode, or credo you are likely to see some errors in this file related to the quoted string, but it shouldn't cause any real issues. This is another reason I might consider protobuf-elixir.

 The `use Protobuf` macro from exprotobuf takes a quoted string of protobuf syntax and generates encoders and decoders for the data as well as an Elixir struct definition. Note that protocol buffers are organized as messages, and messages may have sub-messages. You can read more about the format [here](https://developers.google.com/protocol-buffers/docs/overview#how-do-they-work). Our Android message has a required name, two required enums, and an optional sub message. Distinguishing optional and required fields is a really nice feature of protocol buffers, and allows for succinct interactions when only some fields are needed. 

 I'm also including a wrapper for decoding our messages, because invalid input will cause gpb to throw an error, that I prefer to handle at a higher level. This will be helpful for debugging and testing messages, and we will use it in the final router to handle parsing.

###Getting something useful###

 Next, let's fill in the get function in `router.ex`. Add `alias ProtoMan.Androids` to the top of the module, and edit the get function to look like the following.

 ```elixir
  get "/androids" do
    android = 
      Androids.Android.new(name: "Rock", 
                           special_weapon: :ProtoShield, 
                           version: :'V1', 
                           hp: %Androids.Android.Health{value: 100})
    resp = Androids.Android.encode(android)
      
    conn
    |> put_resp_header("content-type", "application/octet-stream")
    |> send_resp(200, resp)
  end
```

You can see the use of the generated encoder for the Android message here. If you add a call to `IEx.pry` after encoding you can inspect the response and see the binary output, `<<10, 4, 82, 111, 99, 107, 16, 2, 24, 1, 34, 2, 8, 100>>`. One of the reasons that protocol buffers are so small an fast is because they are transmitted in a binary format, rather than plain text like XML or JSON. As an aside, you could use Elixir's excellent binary pattern matching to build a simple, but fast, parser for protocol buffers. You may note that the response header is "application/octet-stream", this isn't strictly necessary and there is no official content type, but a search of StackOverflow turned up a [discuss](https://stackoverflow.com/questions/30505408/what-is-the-correct-protobuf-content-type) that lead me to this choice. At this point you could use curl to check the endpoint, but you wouldn't see anything, since curl isn't really built to work with protobuf. 

We would like to see some output, so let's write a quick client that we can run from the same iex session.

```elixir
  defmodule ProtoMan.Client do
    require Logger
    alias ProtoMan.Androids
    HTTPoison.start
    def get() do
      Logger.info fn -> "Calling for Android list" end
      res = HTTPoison.get! "http://localhost:4001/androids"
      IO.inspect(res.body)
      Logger.info fn -> "Android response code: #{res.status_code}" end
      Androids.Android.decode(res.body)
    end
  end
```

If you restart your iex session and run `ProtoMan.Client.get()` you should see the decoded version of the message.

```elixir
  iex(0)> ProtoMan.Client.get()
  %ProtoMan.Androids.Android{
    hp: %ProtoMan.Androids.Android.Health{value: 100},
    name: "Rock",
    special_weapon: :ProtoShield,
    version: :V1
  }
```

Congratulations, you have now sent and received a protocol buffer message.

##Looking at proto files##

Now that we have a minimal get function in the client, let's take a moment to look at the other functionality in exprotobuf for defining messages. The library also comes with functionality for defining messages in `.proto` files, which is more in line with best practices, is more appropriate for production use, and shouldn't upset your linter. If you're using vscode, install [vscode-proto3](https://github.com/zxh0/vscode-proto3) so that you can make use of syntax highlighting. Atom has [atom-protobuf](https://github.com/podgib/atom-protobuf). Once you have done that, create a folder in `lib` called `proto` and add a file called `messages.proto`. We'll be using this to pass status messages back from the post route to our client. The following should be sufficient for that purpose.

```proto
  message Message {
    enum Status {
      OK = 0;
      ERROR = 1;
    }
    required string text = 1;
    required Status status = 2;
  }
```

The message should be self explanatory, but note that protocol buffer enums use all caps names. Next add a corresponding Elixir module in `lib/proto_man/messages.ex`.

```elixir
  defmodule ProtoMan.Messages do
    use Protobuf, from: Path.expand("../proto/messages.proto", __DIR__)
  end
```

The `use Protobuf` macro we saw earlier may also be passed a file, and will similarly generate encoders, decoders,a nd a struct definition.

##Posting and Receiving Messages##

Now that we have a client, server, and two message types to work with, we can round out the router with a post function that can handle incoming protocol buffer messages. This is the final routing module.

```elixir
  defmodule ProtoMan.Router do
    use Plug.Router
    alias ProtoMan.{Androids, Messages}
    plug :match
    plug :dispatch

    get "/androids" do
      android = 
        Androids.Android.new(name: "Rock", 
                                      special_weapon: :ProtoShield, 
                                      version: :'V1', 
                                      hp: %Androids.Android.Health{value: 100})
      resp = Androids.Android.encode(android)

      conn
      |> put_resp_header("content-type", "application/octet-stream")
      |> send_resp(200, resp)
    end

    post "/androids" do
      with {:ok, proto_bytes, _conn} <-  Plug.Conn.read_body(conn),
          {:ok, _android} <- Androids.safe_decode(proto_bytes),
          message <- Messages.Message.new(text: "successfully posted", status: :OK),
          resp <- Messages.Message.encode(message)
          do
        conn
        |> put_resp_header("content-type", "application/octet-stream")
        |> send_resp(200, resp)
      else
        {:error, error} ->
          message = Messages.Message.new(text: error, status: :ERROR)
          resp = Messages.Message.encode(message)
          conn
          |> put_resp_header("content-type", "application/octet-stream")
          |> send_resp(500, resp)
      end
    end

    match _ do
      send_resp(conn, 404, "oops")
    end
  end
```

The post function provides a nice opportunity to use Elixir's with syntax to read the posted message and build a response, or fall off into error handling. Joseph Kain has a nice explanation of `with` [here](http://learningelixir.joekain.com/learning-elixir-with/). You can see that we're using the `safe_decode/1` function from earlier so that we can gracefully handle parsing errors. Otherwise, this works very much like the get function. In a real application, we would probably persist the posted message, or pass it along, but that isn't really necessary to explore protobuf.

With the router in place, we need a client function to post data, curl and postman don't support pprotobuf, so we nee to write our own. We will do that in the client. As demonstrated below.

```elixir
  defmodule ProtoMan.Client do
    require Logger
    alias ProtoMan.{Androids, Messages}
    HTTPoison.start
    def get() do
      Logger.info fn -> "Calling for Android list" end
      res = HTTPoison.get! "http://localhost:4001/androids"
      IO.inspect(res.body)
      Logger.info fn -> "Android response code: #{res.status_code}" end
      Androids.Android.decode(res.body)
    end

    def post(name, special_weapon, version) do
      post(name, special_weapon, version, nil)
    end

    def post(name, special_weapon, version, hp) do
      with {:ok, proto_buf_bytes} <- encode(name, special_weapon, version, hp),
      {:ok, response} <- HTTPoison.post("http://localhost:4001/androids", proto_buf_bytes) do
        Messages.Message.decode(response.body)
      else
        {:error, error} ->
          error
      end
    end

    defp encode(name, special_weapon, version, hp) when is_nil(hp) do
      try do
        protobuf_bytes =
          Androids.Android.new(name: name, special_weapon: special_weapon, version: version)
          |> Androids.Android.encode
        {:ok, protobuf_bytes}
      rescue
        ErlangError ->
          {:error, "Error encoding data"}
      end
    end

    defp encode(name, special_weapon, version, hp) do
      try do
        protobuf_bytes =
        Androids.Android.new(name: name, special_weapon: special_weapon, version: version, hp: %Androids.Android.Health{value: hp})
          |> Androids.Android.encode
        {:ok, protobuf_bytes}
      rescue
        ErlangError ->
          {:error, "Error encoding data"}
      end
    end
  end
```

Much like the Androids module's `safe_decod/1` function, we're wrapping encoding with functions that handle Erlang errors, and make out sub message optional by using a guard clause. At this point you can restart the iex session and post a message. 

```elixir
  iex(1)> ProtoMan.Client.post("ProtoMan", :ProtoShield, :V2, 100)
  %ProtoMan.Messages.Message{status: :OK, text: "successfully posted"}
```
At this point everything should be working as planned.

##Wrapping Up##

This guide isn't meant to be an exhaustive treatment of the when, why, and how of using protocol buffers in Elixir, but rather an on ramp for exploring the topic on your own. If you want to know more I would suggest reading the official [overview](https://developers.google.com/protocol-buffers/docs/overview), and digging into either exprotobuf or protobuf-elixir. Bing Han, the author of protobuf-elixir is often on the [Elixir slack channel](https://elixir-slackin.herokuapp.com/), and is quite helpful. The [Elixir Forum](https://elixirforum.com/) is also a great place to get help and advice. As always, feel free to reach out to me if you have any questions or comments, and thanks for reading!
