---
title: HTTP Requests in Rust with Reqwest
date: 2017-12-13 03:10 UTC
tags: Rust, HTTP, Reqwest, Functional Programming
---

I have been spending some time recently learning [Rust](https://www.rust-lang.org/en-US/), which if you are unfamiliar is a functional systems programming language with guaranteed memory and thread safety. That's quite a description to wrap your head around, if like me you haven't written much C or other low level code. If you're in the same boat and interested in Rust, the common and best bit of advice it to check out "The Book". [The Book](https://doc.rust-lang.org/stable/book/second-edition/) in it's second edition will walk you through the basics and some advanced topics including writing a basic web server, which is pretty cool. The Book is probably on of the best introductory texts for a programming language I've ever read, though [Why's Poignant Guide to Ruby](http://poignant.guide/) is perhaps a close second.

While the book is great, I generally like to experiment and color outside of the lines while learning a new language. [Exercism](http://exercism.io/) is also a nice place to try out a new language on constrained problems and get community feedback. Rust currently has [77 Exercises](http://exercism.io/languages/rust/exercises) on Exercism at the time of writing this article, and so far I'm enjoying doing them in Rust. One of the other things I like to do when learning a new language is grab and parse some weird pages fro Wikipedia, which usually involves learning how to use packages, making HTTP requests, and parsing the results. Rust is a bit more concerned with types and correctness than other languages I use, so I decided to just start with the request part first.

After some reading over at [/r/rust](https://www.reddit.com/r/rust/) and a search of [crates.io](http://doc.crates.io/) I found [Reqwest](https://github.com/seanmonstar/reqwest), which is a higher level HTTP client built on top of [hyper](https://hyper.rs/). Hyper is fairly low level and is used by a number of popular Rust crates, but requires a bit more Rust knowledge and skill than I currently possess. With simplicity in mind, I'll be demonstrating HTTP calls with Reqwest.

I'll assume you already have Rust installed, or can otherwise take a moment to head over to the [install page](https://www.rust-lang.org/en-US/install.html) and get setup. *[see also](https://doc.rust-lang.org/book/second-edition/ch01-01-installation.html)*

First create a package with cargo:

```bash
  cargo new http_test --bin
```
This creates a new Rust project names http_test that is executable as a binary, due to the `--bin` flag. That means that once compiles, the project can be run as a stand alone piece of code. *[more info](https://doc.rust-lang.org/book/second-edition/ch01-02-hello-world.html#creating-a-project-with-cargo)*

Next, you'll want to add Reqwest to your project. Rust uses [toml](https://github.com/toml-lang/toml) for configuration, and dependencies are listed in `Cargo.toml`. Your `Cargo.toml` should look more or less like the following. 

```toml
  [package]
  name = "http_test"
  version = "0.1.0"
  authors = ["Your Name <your_email@ecample.com>"]

  [dependencies]
  reqwest = "0.8.0"
```

*Feel free to experiment with a newer version of Reqwest, but I'm no promising anything newer than "0.8.0" will work.*

Run `cargo build` and you should see a list of dependencies being compiled ending with something like:

```bash
  ...
  ...
  Compiling reqwest v0.8.0
  Compiling http_test v0.1.0 (file:///Users/your_name/../http_test)
  Finished dev [unoptimized + debuginfo] target(s) in 52.51 secs
```
If the build step fails, then this guide may be out of date, or you Rust installation may not be complete/correct. Otherwise, you're all set to start writing code that uses reqwest. You just need to add `extern crate reqwest;` to the top of `main.rs`, and start working on the code.

```rust
  extern crate reqwest;

  fn main() {
  }
```
*this is what we have so far*


After including the crate, we need to be able to handle errors and read from IO. To do this you will nee to sue parts of the standard library that aren't included by default. We'll add `use std::io::Read;` for the [Read trait](https://doc.rust-lang.org/nightly/std/io/trait.Read.html) and `use std::error::Error;` for the error trait. I'll address those momentarily. Our code should look like the following snippet.

```rust
  extern crate reqwest;

  use std::io::Read;
  use std::error::Error;

  fn main() {
  }
```


For this simple program, the only line in the main function will be the call to a function I'm calling run, for lack of a more inspiring name. The run function doesn't take any arguments and returns a [Result](https://doc.rust-lang.org/nightly/std/result/enum.Result.html) type, which can either be `Ok(T)` or `Err(E)`. This is where our use statement for `std::error::Error` comes into play.  The function definition looks like the following and should return `Ok()` for now.

```rust
  extern crate reqwest;

  use std::io::Read;
  use std::error::Error;

  fn main() {
      run();
  }

  fn run() ->  Result<String, Box<Error>>  {
    Ok("Done".into())
  }
  ```

Now that the bones are in place we can start making a request to Wikipedia, about something interesrint like the [Emu War](https://en.wikipedia.org/wiki/Emu_War). We'll need to [make a get request](https://docs.rs/reqwest/0.8.1/reqwest/#making-a-get-request) with reqwest using `reqwest::get`. The request form reqwest implements Rust's `Read` trait, which is where `std::io::Read` comes into play. Once we get the results. we will read them and convert them into a string using `read_to_string()` [from Read](https://doc.rust-lang.org/std/io/trait.Read.html#method.read_to_string). At this point our run function should look like the following.

```rust
  fn run() ->  Result<String, Box<Error>>  {
      let mut res = reqwest::get("https://en.wikipedia.org/wiki/Emu_War")?;
      let mut body = String::new();
      res.read_to_string(&mut body)?;

      Ok("Done".into())
  }
```

This is all well and good, but you won't see anything useful if you run this code, so let's print the status, headers, and result body using Rust's built in `println!("{}", )` function. The following is our finished program, and it be run with `cargo run`. You'll get a warning about an unused result, but it should still work. The reason we have set up `run()` to return a result is so that you cna take the code and start adapting it to other uses.

```rust
  extern crate reqwest;

  use std::io::Read;
  use std::error::Error;

  fn main() {
      run();
  }

  fn run() ->  Result<String, Box<Error>>  {
      let mut res = reqwest::get("https://en.wikipedia.org/wiki/Emu_War")?;
      let mut body = String::new();
      res.read_to_string(&mut body)?;

      println!("Status: {}", res.status());
      println!("Headers:\n{}", res.headers());
      println!("Body:\n{}", body);

      Ok("Done".into())
  }
```

I hope this has been useful and interesting, and ff you have questions, please feel free to reach out on twitter. Hopefully I'll have time soon to follow up with a post about parsing the results.