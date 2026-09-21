# Generated for Sprint 5 - Cronograma por Actividad

from django.db import migrations, models
import django.db.models.deletion


def truncate_cronogramas(apps, schema_editor):
    CronogramaActividad = apps.get_model('src', 'CronogramaActividad')
    CronogramaActividad.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('src', '0007_agenda_firmantes'),
    ]

    operations = [
        migrations.RunPython(truncate_cronogramas, reverse_code=migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='cronogramaactividad',
            name='id_accion',
        ),
        migrations.AddField(
            model_name='cronogramaactividad',
            name='id_actividad',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='cronograma_actividades',
                to='src.actividad',
                db_column='id_actividad',
                verbose_name='Actividad',
                help_text='Actividad calendarizada (ON DELETE CASCADE)',
            ),
        ),
        migrations.AlterModelOptions(
            name='cronogramaactividad',
            options={
                'ordering': ['id_ficha', 'id_actividad', 'num_mes_inicio_plazo'],
                'verbose_name': 'Cronograma de Actividad',
                'verbose_name_plural': 'Cronogramas de Actividades',
            },
        ),
    ]
