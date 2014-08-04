#!/bin/bash

# Requires umlgraph (http://www.umlgraph.org/doc/indexw.html)
# and dot (graphviz)

SOURCES=schema_now.java schema_desired.java schema_messages.java
DOTFILES=$(subst .java,.dot,$(SOURCES))
PDFFILES=$(subst .dot,.pdf,$(DOTFILES))
PNGFILES=$(subst .dot,.png,$(DOTFILES))

all: $(DOTFILES) $(PDFFILES) $(PNGFILES)

clean:
	rm -f $(DOTFILES)

%.dot : %.java
	umlgraph $(subst .java,,$<) dot

#http://stackoverflow.com/questions/14784405/how-to-set-the-output-size-in-graphviz-for-the-dot-format
#Max google doc resolution is  3500 by 2500 pixels, so we scale to that...
%.png : %.dot
	dot -Tpng -Gsize=35,25! -Gdpi=100 -o $@ $<
	
%.pdf : %.dot
	dot -Tpdf -o $@ $<
		