Static type checking with Flow
==============================

Run flow
--------

To check the javascript code with flow just run:

.. code:: sh

    yarn run flow

(you should also probably install a plugin for your favourite editor (i.e. check "Use the Flow binary included in each project's flow-bin" in ``nuclide`` settings))


Some things to know
-------------------

- If you use ``.bind`` on one of your methods, you'll have to either use a class property instead of a "classic" method (see `this issue on github`_ for more information.)
- If you use a React ``ref`` in your code, you'll have to use an `HTML element`_ type for your ref.

References
----------

- `Flow documentation`_, especially the `React page`_
- `Typing React Components with Flow`_
- `Type-checking React and Redux (+Thunk) with Flow — Part 1`_

.. _`this issue on github`: https://github.com/devtools-html/debugger.html/issues/3172
.. _`Flow documentation`: https://flow.org/en/docs/
.. _`React page`: https://flow.org/en/docs/frameworks/react/
.. _`Typing React Components with Flow`: https://medium.com/@williambeard/typing-react-components-with-flow-ad555673d229
.. _`Type-checking React and Redux (+Thunk) with Flow — Part 1`: https://blog.callstack.io/type-checking-react-and-redux-thunk-with-flow-part-1-ad12de935c36
.. _`HTML element`: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model#HTML_element_interfaces
