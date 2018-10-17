Assembl
=======

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ImaginationForPeople/assembl?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge)

Presentation
------------

Assembl is an Open Source application that enables hundreds or even thousands of people to work together effectively on the definition of new ideas. The application supports the belief that with the proper conditions, people working together can think smarter than any one member of the group could alone. Traditional collective intelligence software tends to refine ideas from one person. Assembl is different. It focuses on co-building new ideas.

Assembl is made with the following technologies :

- HTML5, [MarionetteJS](http://marionettejs.com/)
- [Nginx](http://nginx.org/)
- [The Pyramid Framework](http://www.pylonsproject.org/)
- [SQLAlchemy](http://www.sqlalchemy.org/)
- [Postgres](http://postgresql.org)


Assembl is developed by [Imagination For People](http://imaginationforpeople.org) and [bluenove](http://bluenove.com)

Installation
------------

Installation is described in [INSTALL](https://github.com/assembl/assembl/blob/develop/doc/INSTALL.rst)

Documentation
-------------

You can [browse technical documentation here](http://dev-assembl.bluenove.com/static/techdocs/), or have a look at the [doc/](https://github.com/assembl/assembl/blob/develop/doc/) folder of this repository.


IMPORTANT
---------

Assembl was using the Virtuoso database, but has transitioned back to Postgresql.
Semantic abilities will be brought back in the near future.
In the meantime, if you have an existing installation of Assembl using Virtuoso, we recommend you switch to Postgresql as described [here](https://github.com/assembl/assembl/blob/develop/doc/convert_virtuoso_to_postgresql.rst).
