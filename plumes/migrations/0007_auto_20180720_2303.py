# Generated by Django 2.0.6 on 2018-07-20 23:03

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('plumes', '0006_plume_p_lat_rng'),
    ]

    operations = [
        migrations.AddField(
            model_name='plume',
            name='p_biome',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='plumes.Biome'),
        ),
        migrations.AddField(
            model_name='plume',
            name='p_region',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='plumes.Region'),
        ),
    ]
