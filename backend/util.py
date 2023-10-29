import time

class MultiTimer:

    def __init__(self):
        self.current_stage = ""
        self.stages = {}
        self.last = time.time()

    def set_stage(self, stage):
        now = time.time()
        elapsed = now - self.last
        self.last = now

        prev = self.current_stage
        self.current_stage = stage

        if prev != "" and prev in self.stages:
            self.stages[prev] += elapsed
        else:
            self.stages[prev] = elapsed

    def stop(self):
        self.set_stage("")


