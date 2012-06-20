from ..models.post import Post


class PostAPI(object):
    def __init__(self, obj_model=None):
        if obj_model is None:
            obj_model = Post
        self.Model = obj_model

    def create(self, **fields):
        obj = self.Model(**fields)
        return obj

    def get(self, **criteria):
        return self.Model.get(**criteria)

    def update(self, obj, **fields):
        for key, value in fields.iteritems():
            setattr(obj, key, value)
        return obj

    def delete(self, obj=None, **criteria):
        if obj is None:
            obj = self.get(**criteria)
        obj.delete()

    def list(self, **criteria):
        return self.Model.list(**criteria)
