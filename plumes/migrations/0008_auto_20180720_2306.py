# Generated by Django 2.0.6 on 2018-07-20 23:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plumes', '0007_auto_20180720_2303'),
    ]

    operations = [
        migrations.AddField(
            model_name='plume',
            name='p_area',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='plume',
            name='p_length',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='plume',
            name='p_perimeter',
            field=models.IntegerField(default=0),
        ),
    ]