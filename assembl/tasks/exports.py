from time import sleep
from jobtastic import JobtasticTask


class RandomProgress(JobtasticTask):
    # Must be there
    significant_kwargs = []

    # The max timeout of a task, in case it crashes
    herd_avoidance_timeout = 300  # 5 min

    default_value = 100

    def calculate_result(self, **kwargs):
        freq = 10
        total_count = 100
        i = 0
        for j in range(0, total_count):
            i += j
            self.update_progress(i, total_count, update_frequency=freq)
            sleep(0.5)
        return i
