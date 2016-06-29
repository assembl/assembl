Development: Creating a new model class tutorial
================================================

All model classes should inherit :py:class:`assembl.lib.sqla.BaseOps` (as ``Base``), and many will also inherit :py:class:`assembl.models.DiscussionBoundBase`, which means that they exist within the context of a discussion. Classes that represent information that can be deleted while leaving a trace of their existence will also inherit :py:class:`assembl.lib.history_mixin.TombstonableMixin`, and classes that can have a snapshot taken before modification will inherit :py:class:`assembl.lib.history_mixin.HistoryMixin`.

We will take :py:class:`assembl.models.attachment.Document` as a fairly typical example.

ORM mapping
-----------

The first step is to bind the class to a database table (``__tablename__``) and columns. Each column's name is given by the class variable name, and various attributes are Column arguments, as described in `Declarative Mapping`_.

::

    class Document(DiscussionBoundBase):
        __tablename__ = "document"
        id = Column(Integer, primary_key=True)
        uri_id = Column(URLString)

If the class is a base class with subclasses, we declare a ``type`` (or ``sqla_type``) column, using the pattern for `joined table inheritance`_. We must define the identity for the base class in the ``__mapper_args__``.

::

    type = Column(String(60), nullable=False)
    __mapper_args__ = {
        'polymorphic_identity': 'document',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

Subclasses will only define ``polymorphic_identity`` in their  ``__mapper_args__``.

When we create a foreign keys, we usually also define a `relationship` for that foreign key. That relationship may have a `backref`, which allows to traverse the class backwards. This is described in `relationship configuration`_.

::

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False, index=True)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'documents',
            cascade="all, delete-orphan"),
    )

Note: The cascade options here are redundant; the ``cascade`` argument in the backref asks SQLAlchemy to handle the cascade, whereas the ``ondelete`` cascade ensures deletion by the database. This was done because we did not trust triggers in Virtuoso, but should be revisited with Postgres.

Note 2: TODO: It would be have been a good practice to put a comment in the Foreign key target to indicate the existence of the backref relationships, for documentation purposes.

Some more SQL arguments can be defined in the ``__table__args__`` construct:

::

    __table_args__ = (UniqueConstraint('discussion_id', 'uri_id'), )


DiscussionBoundBase protocol
----------------------------

Two methods have to be defined for subclasses of :py:class:`assembl.models.DiscussionBoundBase`.

1. :py:meth:`assembl.models.DiscussionBoundBase.get_discussion_id` : Define how to get the discussion_id from an instance of the class. It may be given in a column of the instance or in a column of an associated instance. The object may have just been created, in which case the value may have been set either in the foreign, in the relationship, but maybe not both. It is thus good practice to look for both cases.

2. :py:meth:`assembl.models.DiscussionBoundBase.get_discussion_conditions`: a class method giving the SQLAlchemy expression that could be applied to the ``filter`` method to filter instances of this class belonging to the given discussion. This may involve joining on a relationship if the ``discussion_id`` is not a column of this class. In that case, use the provided ``alias_maker`` to obtain suitable aliases for joining. A good example is given in :py:meth:`assembl.models.idea.IdeaLink.get_discussion_conditions`. But the case here is simple.

::

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)


Extra collections
-----------------

The traversal API (:py:mod:`assembl.views.api2`) relies on relationship introspection to find collections of objects related to any given instance. However, it is sometimes necessary to define collections of related objects that are not expressed by a relationship, or to define extra behaviour when an object is instantiated through this collection. These extra behaviours are defined in the class method ``extra_collections``, as a dictionary of subclasses of :py:class:`assembl.views.traversal.AbstractCollectionDefinition`, indexed by name. (collection definitions based on relationships are subclasses of :py:class:`assembl.views.traversal.CollectionDefinition`.) See :py:meth:`assembl.models.discussion.Discussion.extra_collections` for an example.

Duplicate handling
------------------

For some objects, uniqueness constraints can be set in the database, but it is more difficult in some cases, as the uniqueness constraints may span inheritance join tables. In that case, creation of an object will trigger the creation of a query that defines whether that object is unique. That query is created in :py:meth:`assembl.lib.sqla.BaseOps.unique_query` and conditions are added in subclasses. The `unique_query` may not be enforcable for any given class, so the return value will mention whether to enforce it.

The query is used in :py:meth:`assembl.lib.sqla.BaseOps.handle_duplication`, and if the object is found to be a duplicate of an object already stored in the database, what will happen depends on the value of the ``duplicate_handling`` parameter. Usually, this parameter is not set, and the classe's default_duplicate_handling variable is consulted. The different ways duplicate are handled are defined in the :py:class:`assembl.lib.sqla.DuplicateHandling` enum.

::

    default_duplicate_handling = DuplicateHandling.USE_ORIGINAL

    def unique_query(self):
        query, _ = super(Document, self).unique_query()
        return query.filter_by(uri_id=self.uri_id), True


CRUD permissions
----------------

Each class should define the permissions that are required to Create, Read, Update or Delete (CRUD) an instance of that class. These are expressed in the ``crud_permission`` class property, as in instance of :py:class:`assembl.auth.CrudPermissions`.

::

    crud_permissions = CrudPermissions(
            P_ADD_POST, P_READ, P_EDIT_POST, P_ADMIN_DISC,
            P_EDIT_POST, P_ADMIN_DISC)


ViewDefs
--------

Each class should define how it will be represented by default in the REST interfaces. This is done by creating an entry for that class in ``assembl/view_defs/default.json``, as described in :py:mod:`assembl.view_def`. It is also useful to have an entry for the class in ``assembl/view_defs/changes.json``, which determines how much data will be sent to the Websocket when the object is changed.

.. code-block:: javascript

    "Document": {
        "uri": "uri_id",
        "type": true,
        "discussion": true
    }

Finally, create/update operations on the instance may only allow changing a subset of fields; this is defined in ``assembl/view_defs/default_reverse.json``

.. code-block:: javascript

    "Document": {
        "uri": "uri_id",
        "type": false,
        "discussion": false
    }


.. _`Declarative Mapping`: http://docs.sqlalchemy.org/en/latest/orm/mapping_styles.html#declarative-mapping
.. _`joined table inheritance`: http://docs.sqlalchemy.org/en/latest/orm/inheritance.html#joined-table-inheritance
.. _`relationship configuration`: http://docs.sqlalchemy.org/en/latest/orm/relationships.html
