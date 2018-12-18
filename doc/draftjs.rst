Rich text editor (draft-js)
===========================

Documentation: https://draftjs.org/docs/getting-started

.. code-block:: javascript

    <Editor
      editorState={this.state.editorState}
      onChange={this.onChange}
    />

Key concepts
------------

EditorState
~~~~~~~~~~~

Immutable object (Record) that represents the entire state of the
editor:

-  content (text, entities, ...)
-  selection (cursor, focus, ...)
-  history (undo/redo)

ContentState
~~~~~~~~~~~~

Immutable object (Record) that represents the content of the editor:

-  blocks, text, inline styles, entity ranges
-  selection state after rendering
-  selection state before rendering (for undo)

ContentBlock
~~~~~~~~~~~~

Immutable object (Record) that represents the full state of a single
block:

-  text
-  type of block: atomic, unstyled, paragraph, blockquote, ...
-  entities, inline style (bold, italic), depth (for lists)

Atomic blocks: for custom blocks (custom rendering, block data is in an
entity)

Entity
~~~~~~

Objects which are used for annotating text ranges with metadata. For
example: images, links, etc

.. code-block:: javascript

    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const data = entity.getData();

SelectionState
~~~~~~~~~~~~~~

Immutable object (Record) that represents the selection range in the
editor.

-  ``anchor``: beginning point of the selection (takes the selection
   direction into account)
-  ``focus``: end point of the selection (takes the selection direction
   into account)
-  ``start``: start of the selection (no direction)
-  ``end``: end of the selection (no direction)

Each anchor/focus is represented by a ``key`` and an ``offset``:

-  ``key``: key of the block
-  ``offset``: offset of the character within the block

Use anchor and focus if you need the direction, use start and end if you
don't need the direction.

In assembl
----------

Assembl's rich text editor is defined in
``assembl/static2/js/app/components/common/richTextEditor/index.jsx``
(``RichTextEditor`` component)

Storage (in the back-end)
~~~~~~~~~~~~~~~~~~~~~~~~~

Dependency: `draft-convert`_ Common conversion functions are defined in
``assembl/static2/js/app/utils/draftjs.js``

Content state is converted to HTML that is stored in the database:
``customConvertToHTML`` that calls ``entityToHTML`` for each entity
type.

HTML is converted to content state via ``customConvertFromHTML`` that
calls ``htmlToEntity`` for each entity type.

``uploadNewAttachments`` => upload documents and gives us the content
state updated with urls of the documents and the list of document ids.
You **must** call this function before to call a mutation that updates a
rich text field in the database (if your rich text editor uses
attachments).

Plugins
-------

We use ``draft-js-plugins``. Documentation: https://www.draft-js-plugins.com/

Our plugins are defined in ``assembl/static2/workspaces/`` along with
some other draft-js related modules:

-  ``assembl-editor-utils``: utils to ease draft-js usage
-  ``assembl-test-editor-utils``: utils for tests
-  ``draft-js-attachment-plugin``: manages attachments in assembl editor
   (images and documents). Defines converters (``entityToHTML`` and
   ``htmlToEntity``), components (button, form, image, document),
   modifiers (add/remove attachment)
-  ``draft-js-link-plugin``: manages links in assembl editor. Defines
   converters (``entityToHTML`` and ``htmlToEntity``), components
   (button, form, link).
-  ``draft-js-modal-plugin``: used by both attachments and link plugins
   to open a modal when user clicks on a button in the toolbar.

We also use two community plugins from the official repo:

-  ``draft-js-static-toolbar-plugin``: display a toolbar with the
   buttons that we decide to use for our editor.
-  ``draft-js-counter-plugin``: counts the number of remaining
   characters in the editor.

The plugins are created and configured in the editor component's
constructor.

Bonus stage
-----------

Checklist after a change to the rich text editor:

-  rich text in thread
-  rich text in the admin
-  change edit locale in admin
-  reorder the resources in admin


.. _draft-convert: https://www.npmjs.com/package/draft-convert
