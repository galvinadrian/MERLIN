// metadata to work with biomes 

// Biome colors where index corresponds to biome code
let biome_colors = [ 
    'rgb(155,188,255)',
    'rgb(149,178,117)',
    'rgb(88,107,66)', 
    'rgb(197,253,133)', // d needleleaf
    'rgb(186,239,51)',
    'rgb(87,162,0)', 
    'rgb(191,151,193)', 
    'rgb(119,94,120)',
    'rgb(232,227,131)', // woody savannas
    'rgb(153,150,96)',
    'rgb(183,234,208)',
    'rgb(117,152,155)', 
    'rgb(255,217,1)', 
    'rgb(175,175,175)', // urban and built up
    'rgb(199,84,192)',
    'rgb(232,253,255)', 
    'rgb(233,200,118)', 
    'rgb(0,0,0)'
]

// Biome name where index corresponds to biome code
let biome_names = [
    "Water", 
    "E. Needleleaf Forest", 
    "E. Broadleaf Forest", 
    "D. Needleleaf Forest",
    "D. Broadleaf Forest",
    "Mixed Forest", 
    "Closed Shrublands", 
    "Open Shrublands", 
    "Woody Savannas", 
    "Savannas", 
    "Grasslands", 
    "Wetlands", 
    "Croplands", 
    "Urban and Built-Up", 
    "Vegetation Mosaic", 
    "Snow and Ice", 
    "Barren", 
    "Unclassified"
]

// somewhat redundant list of biome codes 
let biome_values =  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,255];