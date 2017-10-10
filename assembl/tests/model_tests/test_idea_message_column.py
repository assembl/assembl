
def test_column_counter_negative(idea_message_column_negative):
    i = idea_message_column_negative.get_positional_index()
    assert i == 1


def test_column_counter_positive(idea_message_column_positive):
    i = idea_message_column_positive.get_positional_index()
    assert i == 0


def test_column_counter_both(idea_message_column_positive,
                             idea_message_column_negative):
    i_1 = idea_message_column_positive.get_positional_index()
    i_2 = idea_message_column_negative.get_positional_index()
    assert i_1 == 0
    assert i_2 == 1
