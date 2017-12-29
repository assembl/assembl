from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String
)

def InheritedId(Base):
    return Column(
        Integer,
        ForeignKey(
            Base.id,
            ondelete='CASCADE',
            onupdate='CASCADE'),
        primary_key=True)
        
def Type():
    return Column(String(60), nullable=False)