from invoke import Collection

import common
import sudoer
import deploy
import build

ns = Collection()
ns.add_collection(Collection.from_module(common))
ns.add_collection(Collection.from_module(sudoer))
ns.add_collection(Collection.from_module(deploy))
ns.add_collection(Collection.from_module(build))
