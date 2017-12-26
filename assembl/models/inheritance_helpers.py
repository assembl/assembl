from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)

def IdColumn(Base):
    return Column(
        Integer,
        ForeignKey(
            Base.id,
            ondelete='CASCADE',
            onupdate='CASCADE'),
        primary_key=True)