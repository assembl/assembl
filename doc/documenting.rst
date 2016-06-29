Development: Documenting Assembl
================================

The documentation of Assembl's backend is written using Sphinx_. Writing python documentation requires being familiar with `Restructured Text`_ and the `Sphinx python domain`_.

The existing Frontend documentation should follows the JSDoc3_ standard, but does so loosely at this point. We are connecting it with Javascript using jsdoc_rst_template_. It should be possible to cross-reference python and javascript using the `Sphinx javascript domain`_. Examples forthcoming.

You can build it with fab env_dev build_doc, and the HTML result can 
subsequently be found in build/sphinx/html/index.html


Cheat sheet
-----------

Hyperlink to a document in the doc::
  :doc:`name_of_rst_document_without_extension` (relative link)

Standard hyperlink::
  `Text of hyperlink <http://url_of_hyperlink>`_


.. _Sphinx: http://sphinx-doc.org/
.. _JSDoc3: http://usejsdoc.org/
.. _jsdoc_rst_template: https://github.com/gocept/jsdoc-rst-template
.. _`Restructured Text`: http://www.sphinx-doc.org/en/stable/rest.html
.. _`Sphinx python domain`: http://www.sphinx-doc.org/en/stable/domains.html?highlight=python%20domain#the-python-domain
.. _`Sphinx javascript domain`: http://www.sphinx-doc.org/en/stable/domains.html?highlight=python%20domain#the-javascript-domain
