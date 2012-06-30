class BaseAPI(object):
    """Basic API functionality on a model, like CRUD."""
    def __init__(self, model_cls):
        """Set the model class this API will use for CRUD operations."""
        self.model_cls = model_cls

    def create(self, obj=None, **fields):
        """Create and save a model instance with the provided values."""
        if not obj:
            obj = self.model_cls(**fields)
        obj.save()
        return obj

    def get(self, **criteria):
        """Return the model instance corresponding to the criteria."""
        return self.model_cls.get(**criteria)

    def update(self, obj, **fields):
        """Update the model instance with the provided values and save it."""
        for key, value in fields.iteritems():
            setattr(obj, key, value)
        obj.save()
        return obj

    def delete(self, obj=None, **criteria):
        """Delete a model instance, or the one found using the criteria."""
        if obj is None:
            obj = self.model_cls.get(**criteria)
        obj.delete()
        return True

    def list(self, **criteria):
        """Return a list of model instances according to the criteria."""
        return self.model_cls.list(**criteria)
