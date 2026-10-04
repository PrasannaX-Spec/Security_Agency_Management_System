class ScheduleConflictError(Exception):
    """Raised when a proposed shift conflicts with an existing active shift."""

    def __init__(self, message, conflicting_schedule=None):
        super().__init__(message)
        self.message = message
        self.conflicting_schedule = conflicting_schedule
