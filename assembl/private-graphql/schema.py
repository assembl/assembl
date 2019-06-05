import graphene
from assembl.lib.logging import getLogger

log = getLogger('assembl')


class MyBasicMutation(graphene.Mutation):
    class Input:
        task_id = graphene.String()

    task_name = graphene.String()

    @staticmethod
    def mutate(root, args, context, info):
        task_id = args.get('task_id')
        log.info("inside of my_private_mutation with information with task id %s" % task_id)
        return MyBasicMutation(task_name=task_id)


class Query(graphene.ObjectType):
    task_name = graphene.String()

    def resolve_task_name(self, args, context, info):
        return "task name"


class Mutations(graphene.ObjectType):
    my_basic_mutation = MyBasicMutation.Field()


Schema = graphene.Schema(query=Query, mutation=Mutations)
