from django.db import models
from django.contrib.postgres.fields import ArrayField
# from django.contrib.gis.db import models as geomodels 

# Create your models here.
class RegionAlias(models.Model) : 
    region_ID = models.IntegerField()
    name = models.CharField(max_length=100)

class BiomeAlias(models.Model) : 
    biome_ID = models.IntegerField()
    name = models.CharField(max_length=100)

class Region(models.Model) : 
    region_ID = models.IntegerField(primary_key=True)
    region_name = models.CharField(max_length=200)
    region_alias = models.ManyToManyField(RegionAlias) # for future lookup table 

class Biome(models.Model) : 
    biome_ID = models.IntegerField(primary_key=True)
    biome_name = models.CharField(max_length=200) 
    biome_alias = models.ManyToManyField(BiomeAlias) # for future lookup table

# the table that represents plumes, these columns closely follow the json structure gener
class Plume(models.Model) : 
    # accounting variables for fire plumes 
    p_name = models.CharField(max_length=200,unique=True)
    p_url = models.CharField(max_length=400)
    p_date = models.DateTimeField()

    # # number of wind corrected heights 
    p_num_hts = models.IntegerField(default=0)

    # # latitude and longitude of "source" of fire 
    p_src_long = models.DecimalField(max_digits=6,decimal_places=3,default=0)
    p_src_lat = models.DecimalField(max_digits=6,decimal_places=3,default=0)

    p_long_rng = ArrayField(models.DecimalField(
        max_digits = 6, 
        decimal_places = 3
    ),size=2,default=[0.000,0.000])
    p_lat_rng = ArrayField(models.DecimalField(
        max_digits = 6, 
        decimal_places = 3
    ),size=2,default=[0.000,0.000])

    # region and biome 
    p_region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True)
    p_biome = models.ForeignKey(Biome, on_delete=models.CASCADE, null=True)

    # basic geometric fields 
    p_perimeter = models.IntegerField(default=0)
    p_length = models.IntegerField(default=0)
    p_area = models.IntegerField(default=0)

    p_terr_mean_ht = models.DecimalField(max_digits=7,decimal_places=3,default=0)
    p_terr_max_ht = models.IntegerField(default=0)
    p_terr_min_ht = models.IntegerField(default=0)
    
    p_fire_ht = models.IntegerField(default=0)

    p_med_ht = models.IntegerField(default=0, null=True)
    p_max_ht = models.IntegerField(default=0, null=True)
    p_min_ht = models.IntegerField(default=0, null=True)
    p_dev_ht = models.FloatField(default=0, null=True)
    p_local_var_ht = models.FloatField(default=0, null=True)

    p_dir = models.FloatField(default=0)
    p_dir_vec = ArrayField(ArrayField(models.DecimalField(
        max_digits = 6, 
        decimal_places = 3,
        default=0
    ), size = 2,default=[0.000,0.000]), size = 2,null=True)

    p_wind_dir_diff = models.IntegerField(default=0,null=True)

    p_avg_ss_albedo = ArrayField(models.FloatField(null=True,blank=True),size=4,default=[0.0,0.0,0.0,0.0],null=True)
    p_avg_opt_depth = ArrayField(models.FloatField(null=True,blank=True),size=4,default=[0.0,0.0,0.0,0.0],null=True)

    p_num_fire_pts = models.IntegerField(default=0)

    p_total_frp = models.IntegerField(default=0, null=True)
    p_max_frp = models.IntegerField(default=0, null=True)
    p_avg_frp = models.FloatField(default=0, null=True)

    p_max_angstrom = models.FloatField(default=0,null=True)
    p_avg_angstrom = models.FloatField(default=0,null=True)

    p_clouds = models.BooleanField(default=False)



     # the plume object for this plume, we initialize the fields to order the JSON uniformly and 
            # # in accordance with the schema in the README 
            # plumeobj = { 
            #     "id" : "", 
            #     "url" : "",
            #     "date" : [],
            #     "time" : [],
            #     "num_hts" : 0, 
            #     "min_ht_measure" : 0, 
            #     "max_ht_measure" : 0,
            #     "long" : 0.0,  
            #     "lat" : 0.0, 
            #     "long_rng" : [],
            #     "lat_rng" : [],
            #     "coords" : [], 
            #     "polygon" : [], 
            #     "region" : [], 
            #     "biome" : [], 
            #     "perimeter" : 0, 
            #     "length" : 0, 
            #     "area" : 0, 
            #     "area_pp" : 0,
            #     "p_area_covered" : 0,  
            #     "terr_mean_ht" : 0, 
            #     "terr_max_ht" : 0, 
            #     "terr_min_ht" : 0, 
            #     "fire_ht" : 0, 
            #     "plume_med_ht" : 0, 
            #     "plume_max_ht" : 0, 
            #     "plume_min_ht" : 0, 
            #     "plume_dev_ht" : 0, 
            #     "plume_local_var_ht" : 0, 
            #     "plume_dir" : 0, 
            #     "plume_dir_vec" : [], 
            #     "wind_dir_diff" : 0,
            #     "avg_avg_opt_depth" : [], 
            #     "avg_ss_albedo" : [], 
            #     "total_frp" : 0, 
            #     "max_frp" : 0, 
            #     "avg_frp" : 0, 
            #     "max_angstrom" : 0, 
            #     "avg_angstrom" : 0, 
            #     "num_fire_pts" : 0, 
            #     "cloud" : 





    

