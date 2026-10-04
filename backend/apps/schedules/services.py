from django.db import transaction
from django.core.exceptions import ValidationError
from apps.guards.models import Guard
from apps.schedules.models import DutySchedule
from apps.schedules.exceptions import ScheduleConflictError


class ScheduleService:
    @staticmethod
    def validate_relationships(client, location, post, guard, shift_start, shift_end):
        if shift_end <= shift_start:
            raise ValidationError("Shift end time must be later than shift start time.")

        if guard.status != Guard.Status.ACTIVE:
            raise ValidationError("Cannot assign shifts to an inactive guard.")

        if post.location_id != location.id:
            raise ValidationError("Selected post does not belong to the selected site location.")

        if location.client_id != client.id:
            raise ValidationError("Selected site location does not belong to the selected client.")

    @staticmethod
    def calculate_post_capacity_warning(post, shift_start, shift_end):
        """
        Calculates whether the post's required capacity is exceeded based on the
        current database state. Strictly advisory and non-blocking.
        """
        overlapping_count = DutySchedule.objects.filter(
            post=post,
            status=DutySchedule.Status.SCHEDULED,
            shift_start__lt=shift_end,
            shift_end__gt=shift_start,
        ).count()

        if overlapping_count > post.required_guard_count:
            return (
                f"Post required guard count ({post.required_guard_count}) is exceeded "
                f"({overlapping_count} currently assigned)."
            )
        return None

    @classmethod
    def create_schedule(cls, client, location, post, guard, shift_start, shift_end, created_by=None):
        cls.validate_relationships(client, location, post, guard, shift_start, shift_end)

        with transaction.atomic():
            # Concurrency Note: select_for_update() locks the Guard row on PostgreSQL,
            # serializing overlapping booking attempts. On SQLite, row locking is a no-op.
            locked_guard = Guard.objects.select_for_update().get(pk=guard.pk)

            conflict = DutySchedule.objects.filter(
                guard=locked_guard,
                status=DutySchedule.Status.SCHEDULED,
                shift_start__lt=shift_end,
                shift_end__gt=shift_start,
            ).select_related("location", "post").first()

            if conflict:
                raise ScheduleConflictError(
                    message=(
                        f"Guard is already scheduled from "
                        f"{conflict.shift_start.strftime('%Y-%m-%d %H:%M')} to "
                        f"{conflict.shift_end.strftime('%H:%M')} at {conflict.location.name} "
                        f"({conflict.post.name})."
                    ),
                    conflicting_schedule=conflict,
                )

            schedule = DutySchedule.objects.create(
                guard=locked_guard,
                client=client,
                location=location,
                post=post,
                shift_start=shift_start,
                shift_end=shift_end,
                status=DutySchedule.Status.SCHEDULED,
                created_by=created_by,
            )

            # Capacity warning calculated from final committed database state
            advisory_warning = cls.calculate_post_capacity_warning(post, shift_start, shift_end)

        return schedule, advisory_warning

    @classmethod
    def update_schedule(cls, instance, data):
        """
        Updates an existing schedule. Uses explicit key checks (no 'or' fallback semantics)
        and locks both current and newly assigned guards to prevent race conditions.
        """
        client = data["client"] if "client" in data else instance.client
        location = data["location"] if "location" in data else instance.location
        post = data["post"] if "post" in data else instance.post
        target_guard = data["guard"] if "guard" in data else instance.guard
        shift_start = data["shift_start"] if "shift_start" in data else instance.shift_start
        shift_end = data["shift_end"] if "shift_end" in data else instance.shift_end

        cls.validate_relationships(client, location, post, target_guard, shift_start, shift_end)

        with transaction.atomic():
            # Lock the guard row(s). If guard changed, sort IDs to prevent deadlocks
            guard_ids_to_lock = sorted(list({instance.guard_id, target_guard.id}))
            locked_guards = {g.id: g for g in Guard.objects.select_for_update().filter(pk__in=guard_ids_to_lock)}
            locked_target_guard = locked_guards[target_guard.id]

            conflict = DutySchedule.objects.filter(
                guard=locked_target_guard,
                status=DutySchedule.Status.SCHEDULED,
                shift_start__lt=shift_end,
                shift_end__gt=shift_start,
            ).exclude(pk=instance.id).select_related("location", "post").first()

            if conflict:
                raise ScheduleConflictError(
                    message=(
                        f"Guard is already scheduled from "
                        f"{conflict.shift_start.strftime('%Y-%m-%d %H:%M')} to "
                        f"{conflict.shift_end.strftime('%H:%M')} at {conflict.location.name} "
                        f"({conflict.post.name})."
                    ),
                    conflicting_schedule=conflict,
                )

            instance.client = client
            instance.location = location
            instance.post = post
            instance.guard = locked_target_guard
            instance.shift_start = shift_start
            instance.shift_end = shift_end
            instance.save()

            # Capacity warning calculated from final state after update
            advisory_warning = cls.calculate_post_capacity_warning(post, shift_start, shift_end)

        return instance, advisory_warning

    @staticmethod
    def cancel_schedule(instance):
        instance.status = DutySchedule.Status.CANCELLED
        instance.save(update_fields=["status", "updated_at"])
        return instance
