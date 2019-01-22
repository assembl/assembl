from invoke import Collection

import sudoer
import assembl

ns = Collection()
ns.add_collection(Collection.from_module(sudoer))
ns.add_collection(Collection.from_module(assembl))
