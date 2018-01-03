from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)


def Id():
    return Column(Integer, primary_key=True)
    
def ForeignId(ForeignModel, fk_kwargs={}, **kwargs):
    return Column(
        Integer,
        ForeignKey(ForeignModel.id, **fk_kwargs),
        **kwargs)