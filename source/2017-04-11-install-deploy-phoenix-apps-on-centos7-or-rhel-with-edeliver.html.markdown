---
title: Install & Deploy Phoenix Apps on Centos7 or RHEL with edeliver
date: 2017-04-11 23:48 UTC
tags: elixir, phoenix, linux, devops, edeliver
---
The origional gist can be found [here](https://gist.github.com/Ch4s3/77f5946972f7677b0ab4e3a9d9e22729)
**Set the environment variables**

Install nano(or not if you intend to use vi)

```
  yum install -y nano
```

Open `~/.profile` with `nano ~/.profile` and add the following:

```bash
  export ERLANG_VERSION="19.1.5"
  export ELIXIR_VERSION="1.4.0"
  export PHOENIX_VERSION="1.2.1"
  export LANG="en_US.UTF-8"
  export LANGUAGE="en_US.en"
  export LC_ALL="en_US.UTF-8"
  export PORT=4000
  export HOSTNAME="YOUR HOSTNAME HERE"
  export GUARDIAN_SECRET="ADD A SECRET FOR GUARDIAN IF YOU USE IT"
```
*This is a good time to set up you ENV vars in general.*

Use `cmd-shift-o` to save and `cmd-shift-x` to quit nano.

Run `source ~/.profile` and check `env` to make sure everything is set.

**Begin installing required packages**

```bash
  yum -y install --setopt=tsflags=nodocs epel-release wget unzip uuid less bzip2 git-core inotify-tools gcc
```

**Install Erlang**

```bash
  yum -y install https://packages.erlang-solutions.com/erlang/esl-erlang/FLAVOUR_1_general/esl-erlang_${ERLANG_VERSION}~centos~7_amd64.rpm && \
  yum -y install esl-erlang-${ERLANG_VERSION} && \
  yum -y update && \
  yum -y reinstall glibc-common glibc
```

**Install Nodejs and Yarn**
```bash
  curl --silent --location https://rpm.nodesource.com/setup_7.x | bash -
  wget https://dl.yarnpkg.com/rpm/yarn.repo -O /etc/yum.repos.d/yarn.repo
  yum -y install nodejs
  yum clean all
  yum install yarn
```

**Download and Install Elixir**
```bash
  cd /tmp && \
  wget https://github.com/elixir-lang/elixir/releases/download/v${ELIXIR_VERSION}/Precompiled.zip && \
  unzip -d /usr/local/elixir -x Precompiled.zip && \
  rm -f /tmp/Precompiled.zip
```

**Set Elixir on the path**
Open `~/.bashrc` with `nano ~/.bashrc` and add the following:
```
  export PATH="$PATH:/usr/local/elixir/bin"
```

Then reload the `profile` with `source ~/.profile`.

Test the install by running `iex`.

If it works enter `ctrl-c` twice to exit.

**Install Hex and Phoenix**
Run the following:
```bash
  yes | mix local.hex
  yes | mix archive.install https://github.com/phoenixframework/archives/raw/master/phoenix_new-$PHOENIX_VERSION.ez
```

**Exit the ssh session**
Enter `ctrl-d` to return to you system's terminal.

**Clone the Repo**

In you desired directory run:
```bash
  git clone git@github.com:YOUR_REPO/YOUR_APP.git
```
*If necessary also install Elixir, Erlang, and Phoenix locally following [these instructions.](http://www.phoenixframework.org/docs/installation)*

**Get and compile the dependencies**

Run `mix deps.get`

**Check the edeliver config**

Make sure edeliver is configured correctly.

```
  open .deliver/config
```

Check the following:
```
  BUILD_HOST="server ip address goes here"
  BUILD_USER="server user name for deployment goes here"
```

If they have are not correct, set them to the values for the desired server.

**Generate a new secret key**

Run `mix phoenix.gen.secret` and copy the output for the next step.

**SSH back into the server**

Create a production secrets file at `/home/$BUILD_USER/build_files/prod.secret.exs` where `$BUILD_USER` is the server's deployment user.

The file should contain the following

```elixir
  use Mix.Config

  config :your_app, YourApp.Endpoint,
    secret_key_base: "THE PRODUCTION KEY FROM THE PREVIOUS STEP GOES HERE"

  # Configure your database
  config :your_app, YourApp.Repo,
    adapter: Ecto.Adapters.Postgres,
    username: "DATABASE USERNAME",
    password: "DATABASE PASSWORD",
    database: "your_app_prod",
    hostname: "DATABASE HOST ADDRESS?NAME,
    port: "5432",
    pool_size: 20
```

**Exit the server**

**Build the First Release**

Run the following:

```bash
  mix edeliver build release [--revision=<git-revision>|--tag=<git-tag>] [--branch=<git-branch>]
```

In my case for staging I run:

```bash
  mix edeliver build release --branch=develop --verbose
```

Use `--branch=develop` to deploy staging, `master` is the default.

Visit the [edeliver github](https://github.com/boldpoker/edeliver) to view issues and the [docs](https://hexdocs.pm/edeliver/api-reference.html).

I also use a script called `deploy` for this which looks like:

```bash
  #!/bin/bash -ex
  BRANCH=${1:-develop}; #arg 1 or develop
  ENV=${2:-staging}; #arg2 or staging

  mix edeliver build release --branch=$BRANCH --verbose
  mix edeliver deploy release to $ENV --verbose
  mix edeliver start $ENV
  mix edeliver migrate $ENV up --verbose
  mix edeliver ping $ENV
```
It can take one, two, or no arguments. Make sure to run`chmod +x deploy` so you can run it.

```bash
  ./deploy # this defaults to the branch develop and the env of staging
  ./deploy master production # will deploy master to production
```

**Deploy Your App!**

Run the following:

```bash
  ./deploy
```

The last result should look like:

```bash
  EDELIVER BEACON WITH PING COMMAND

  -----> pinging staging servers

  staging node:

    user    : YOUR_USER
    host    : YOUR HOST
    path    : YOUR DEPLOY PATH
    response: pong

  PING DONE!
```

If it does, you're all set! Otherwise, head over to the [Elixir Forums](https://elixirforum.com/t/need-help-deploying-to-red-hat-enterprise-linux-rhel) and hit us with a question.
