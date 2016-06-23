from unittest import TestCase
from colander import Invalid
from assembl.lib.colander import ValidateMeta


class ValidationTest(TestCase):
    def test_validation(self):
        from assembl.lib.sqla import Base as SQLAlchemyBaseModel
        from sqlalchemy import (
            Column,
            Integer,
            Unicode,
        )

        class SampleModel(SQLAlchemyBaseModel):
            __metaclass__ = ValidateMeta
            __tablename__ = 'sample'
            id = Column(Integer, primary_key=True)
            topic = Column(Unicode(255), nullable=False)

        ca = SampleModel.__ca__

        data = {
            'id': 12,
            'topic': None,
        }
        self.assertRaises(Invalid, ca.deserialize, data)

        data = {
            'id': 12,
            'topic': 'truc',
        }
        data_dict = ca.deserialize(data)
        inst = SampleModel(**data_dict)

        self.assertEquals(inst.id, 12)
        self.assertEquals(inst.topic, 'truc')

    def test_validation_override(self):
        from colanderalchemy import (
            SQLAlchemySchemaNode,
        )
        from assembl.lib.sqla import Base as SQLAlchemyBaseModel
        from sqlalchemy import (
            Column,
            Integer,
            Unicode,
        )

        class SampleModel(SQLAlchemyBaseModel):
            __metaclass__ = ValidateMeta
            __tablename__ = 'sample_2'
            __ca_field_overrides__ = {
                'topic': {
                    'name': 'the_topic',
                },
                'id': {
                    'name': 'the_id',
                }
            }
            id = Column(Integer, primary_key=True)
            topic = Column(
                Unicode(255),
                nullable=False,
                )
            gerbil = Column(
                Unicode(255),
                nullable=False,
                )

        ca = SampleModel.__ca__

        data = {
            'id': 12,
            'topic': 'truc',
            'gerbil': 'wak',
        }
        self.assertRaises(Invalid, ca.deserialize, data)

        sample_inst = SampleModel(
            topic='asd',
            id=12,
            gerbil='wak',
        )

        res = ca.dictify(sample_inst)
        self.assertEquals(res['the_topic'], sample_inst.topic)
        self.assertEquals(res['the_id'], sample_inst.id)
        self.assertEquals(res['gerbil'], sample_inst.gerbil)

        data = {
            'the_id': 12,
            'the_topic': 'truc',
            'gerbil': 'wak',
        }
        # objectify not yet in colanderalchemy 0.2
        # new_obj = SampleModel.__ca__.objectify(data)
        # self.assertEquals(new_obj.id, 12)
        # self.assertEquals(new_obj.topic, 'truc')
        # self.assertEquals(new_obj.gerbil, 'wak')

        # data = {
        #     'the_id': 12,
        #     'topic': 'truc',
        #     'gerbil': 'wak',
        # }

        # self.assertRaises(
        #     Invalid, SampleModel.__ca__.objectify, data)
