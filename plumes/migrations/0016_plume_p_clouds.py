# Generated by Django 2.0.6 on 2018-07-20 23:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plumes', '0015_auto_20180720_2316'),
    ]

    operations = [
        migrations.AddField(
            model_name='plume',
            name='p_clouds',
            field=models.BooleanField(default=False),
        ),
    ]
