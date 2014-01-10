
def get_fixture(scoped_session):
    from fixture import SQLAlchemyFixture
    from fixture.style import NamedDataStyle
    import assembl.models
    fixture = SQLAlchemyFixture(
        env=assembl.models, scoped_session=scoped_session, style=NamedDataStyle())
    return fixture
