# script to load the geo table data (biome region and aliases) into
# the plume database
from plumes.models import Region, Biome

regions = [ 
    "africa",
    "australia", 
    "southwest eurasia",  
    "north america", 
    "boreal eurasia", 
    "south america", 
    "south asia"
]

biomes = [ 
    "water",
     "evergreen needleleaf forest", 
     "evergreen broadleaf forest", 
     "deciduous needleleaf forest",
     "deciduous broadleaf forest",
     "mixed forest", 
     "closed shrublands", 
     "open shrublands", 
     "woody savannas", 
     "savannas", 
     "grasslands" , 
     "permanent wetlands" , 
     "croplands" , 
     "urban or built up" ,
     "natural vegetation mosaic" , 
     "snow and ice" , 
     "barren or sparsely vegetated" ,
     "fill Value/Unclassified"
]

index = 0
for region in regions : 
    reg = Region(region_ID = index, region_name = region)
    reg.save()
    index += 1

index = 0
for biome in biomes : 
    if (index == 17) : 
        index = 255
    bi = Biome(biome_ID = index, biome_name = biome)
    bi.save()
    index += 1