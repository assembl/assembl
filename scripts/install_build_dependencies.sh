#!/bin/sh
set -e

apt-get update -qq
apt-get install -yqq \
    apt-transport-https \
    automake \
    bison \
    build-essential \
    flex \
    gawk \
    rsync \
    gperf \
    graphviz \
    libffi-dev \
    libgraphviz-dev \
    libhiredis-dev \
    libmemcached-dev \
    libpq-dev \
    libreadline-dev \
    libssl-dev \
    libxml2-dev \
    libxmlsec1-dev \
    libxslt1-dev \
    libzmq3-dev \
    pkg-config \
    python-dev

pip install -r requirements-build.txt
