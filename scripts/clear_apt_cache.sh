#!/bin/sh
apt-get autoclean -qq && apt-get autoremove -qq && rm -rf /var/lib/apt/lists/*
