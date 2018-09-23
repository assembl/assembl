Writing documentation for Assembl
=================================

The documentation of Assembl's backend is written using Sphinx_. Writing python documentation requires being familiar with `Restructured Text`_ and the `Sphinx python domain`_, especially how to make `python cross-references`_ .

The existing Frontend documentation should follows the JSDoc3_ standard, but does so loosely at this point. We are connecting it with Javascript using jsdoc_rst_template_. It should be possible to cross-reference python and javascript using the `Sphinx javascript domain`_. Examples forthcoming.

You can build it with ``fab -c assembl/configs/develop.rc build_doc``, and the HTML result can 
subsequently be found in ``assembl/static/techdocs``.


Cheat sheet
-----------

How to insert hyperlinks to various objects:

.. code-block:: rest

    :doc:`name_of_rst_document_without_extension` (relative link)

    `Text of hyperlink <http://url_of_hyperlink>`_

    `Name of hyperlink`_

    .. _`Name of hyperlink`: http://location.of.hyperlink.com/

    ``inline literal``

    :js:class:`JsClassNameWithoutNamespace`

    :py:mod:`dotted.module.or.package`

    :py:class:`dotted.class`

    :py:meth:`dotted.class.method`

    :py:func:`dotted.function`

    :py:data:`dotted.module.variable`

    :py:const:`dotted.constant`

    :py:attr:`dotted.instance.or.class.variable`

    :py:exc:`dotted.exception`

    :py:obj:`dotted.instance`


.. _Sphinx: http://sphinx-doc.org/
.. _JSDoc3: http://usejsdoc.org/
.. _jsdoc_rst_template: https://github.com/gocept/jsdoc-rst-template
.. _`Restructured Text`: http://www.sphinx-doc.org/en/stable/rest.html
.. _`Sphinx python domain`: http://www.sphinx-doc.org/en/stable/domains.html?highlight=python%20domain#the-python-domain
.. _`Sphinx javascript domain`: http://www.sphinx-doc.org/en/stable/domains.html?highlight=python%20domain#the-javascript-domain
.. _`python cross-references`: http://www.sphinx-doc.org/en/stable/domains.html?highlight=python%20domain#cross-referencing-python-objects
