import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedules', '0001_initial'),
        ('clients', '0001_initial'),
        ('locations', '0003_location_client_post'),
    ]

    operations = [
        migrations.AddField(
            model_name='dutyschedule',
            name='client',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='schedules',
                to='clients.client',
            ),
        ),
        migrations.AddField(
            model_name='dutyschedule',
            name='post',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='schedules',
                to='locations.post',
            ),
        ),
        migrations.AddField(
            model_name='dutyschedule',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='dutyschedule',
            name='location',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='schedules',
                to='locations.location',
                verbose_name='Site Location',
            ),
        ),
        migrations.RemoveIndex(
            model_name='dutyschedule',
            name='duty_schedu_guard_i_e19287_idx',
        ),
        migrations.AddIndex(
            model_name='dutyschedule',
            index=models.Index(fields=['guard', 'shift_start', 'shift_end'], name='duty_sched_guard_time_idx'),
        ),
        migrations.AddIndex(
            model_name='dutyschedule',
            index=models.Index(fields=['location', 'shift_start'], name='duty_sched_loc_time_idx'),
        ),
        migrations.AddIndex(
            model_name='dutyschedule',
            index=models.Index(fields=['status', 'shift_start'], name='duty_sched_status_time_idx'),
        ),
    ]
