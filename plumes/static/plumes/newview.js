// javascript to control the view interface and establish various visual elements 
const event = new CustomEvent('data_load');
// const event = new CustomEvent('data_change');
let view_dropped = -1;

let sliders = $('.filter-slider');
let ranges = [
    {'min' : 1, 'max' : 12481}, 
    {'min' : 1, 'max' : 1916}, 
    {'min' : 0, 'max' : 1}, 
    {'min' : 0, 'max' : 1}, 
]

sliders.each(function(i,slider) {
    noUiSlider.create(slider, {
        start: [ranges[i]['min'], ranges[i]['max']],
        tooltips: [true,true],
        connect: true,
        range: ranges[i]
    }).on('change',function(){ 
        session.fetch_data();
    });
})

// Class representing a data object 
class Filter { 
    // when you construct the data object we retrieve a data query from 
    // the current filters and save that into the content of the object 
    constructor(biome_set,region_set,fill,index) { 
        let getter = $('#filter-height')[0].noUiSlider.get();
        this.min_plume_ht = parseInt(getter[0]); 
        this.max_plume_ht = parseInt(getter[1]); 

        getter = $('#filter-frp')[0].noUiSlider.get();
        this.min_frp = parseInt(getter[0]);
        this.max_frp = parseInt(getter[1]);

        
        getter = $('#filter-aod')[0].noUiSlider.get(); 
        this.min_aod = getter[0]; 
        this.max_aod = getter[1];

        getter = $('#filter-ssa')[0].noUiSlider.get(); 
        this.min_ssa = getter[0]; 
        this.max_ssa = getter[1];

        this.start_date = $('#start-date').val();
        this.end_date = $('#end-date').val();

        this.biome_set = new Set(biome_set); 
        this.region_set = new Set(region_set); 

        // these are the actual variables used by a view to interact with data
        this.content = []; 
        this.mask = false;
        this.mask = [];
        this.num_plumes = 0; 
        this.index = index;

        // create an event dispatcher 
        this.dispatcher = new EventTarget(); 

        // whether or not the data is ready 
        this.ready = false; 
        if (fill) this.get(); 
    }

    // load this data to the filter set 
    load() { 
        let self = this; 
        // console.log(self);

        $('#filter-height')[0].noUiSlider.set([
            this.min_plume_ht, 
            this.max_plume_ht
        ]);

        $('#filter-frp')[0].noUiSlider.set([
            this.min_frp, 
            this.max_frp
        ]);

        $('#filter-aod')[0].noUiSlider.set([
            this.min_aod, 
            this.max_aod
        ]);

        $('#filter-ssa')[0].noUiSlider.set([
            this.min_ssa, 
            this.max_ssa
        ]);


        $('#start-date').val(this.start_date);
        $('#end-date').val(this.end_date);

        session.biomes.clear(); 
        session.regions.clear();

        $('.multiSel.0').empty();
        $('.multiSel.1').empty();

        $('#biome-drop > li > input').each(function() {
            // console.log($(this).val());
            $(this).prop('checked',false);
        })

        $('#region-drop > li > input').each(function() {
            // console.log($(this).val());
            $(this).prop('checked',false);
        })

        if (this.biome_set.size == 0) { 
            $('.hida.0').show();
        } else{ 
            $('.hida.0').hide();
            this.biome_set.forEach(function(id) {
                session.biomes.add(id);
                $('.multiSel.0').append('<span title="biome' + id + '">' + biome_names[id] + ',</span>');
            }) 

            $('#biome-drop > li > input').each(function(i) {
                // console.log($(this).val());
                if (self.biome_set.has(i.toString())) $(this).prop('checked',true);
            })
        }

        if (this.region_set.size == 0) { 
            $('.hida.1').show();
        } else {
            $('.hida.1').hide();
            this.region_set.forEach(function(id) {
                session.regions.add(id);
                $('.multiSel.1').append('<span title="region' + id + '">' + region_names[id] + ',</span>');
            })

            $('#region-drop > li > input').each(function(i) {
                // console.log($(this).val());
                // console.log(i);
                if (self.region_set.has(i.toString())) $(this).prop('checked',true);
            })
        }
    }

    // update this data object with the current filter set
    update(biome_set,region_set) { 
        let getter = $('#filter-height')[0].noUiSlider.get();
        this.min_plume_ht = parseInt(getter[0]); 
        this.max_plume_ht = parseInt(getter[1]); 

        getter = $('#filter-frp')[0].noUiSlider.get();
        this.min_frp = parseInt(getter[0]);
        this.max_frp = parseInt(getter[1]);

        
        getter = $('#filter-aod')[0].noUiSlider.get(); 
        this.min_aod = getter[0]; 
        this.max_aod = getter[1];

        getter = $('#filter-ssa')[0].noUiSlider.get(); 
        this.min_ssa = getter[0]; 
        this.max_ssa = getter[1];

        this.start_date = $('#start-date').val();
        this.end_date = $('#end-date').val();

        this.biome_set = new Set(biome_set); 
        this.region_set = new Set(region_set); 

        this.get(); 
    }

    // query the server with this specific data object 
    get() { 
        // need to build the query string as follows 
        //[b1,b2,...eb,r1,r2,...er,maxh,minh,maxf,minf,st,et]
        //time format = year-month-day

        let query_str = ''  

        this.biome_set.forEach(function(biome) { 
            query_str += biome + ','
        })

        // end biome tag
        query_str += 'eb,'; 

        this.region_set.forEach(function(region) { 
            query_str += region + ','
        })
        // end region tab
        query_str += 'er,'; 

        query_str += this.max_plume_ht + ',' + this.min_plume_ht + ',' 
                + this.max_frp + ',' + this.min_frp + ',' 
                + this.start_date + ',' + this.end_date;


        // console.log(query_str);
        let url = 'http://127.0.0.1:8000/query/?q=' + query_str;
        let self = this; 

        session.show_loading_icon();
        $.ajax({ 
            url : url, 
            type : 'GET', 
            success : (data) => {
                self.content = data;
                if (!self.masked) { 
                    self.mask = Array.apply(null, Array(data.length)).map(Number.prototype.valueOf,0);
                }
                
                self.num_plumes = data.length;
                self.ready = true; 
                self.dispatcher.dispatchEvent(event);
                session.hide_loading_icon();
            }, 
            error : () => { 
                alert('there was an error'); 
            }
        })
    }

    // return the data of the data object
    data() {
        return this.content; 
    }

    // return the length of the data object 
    size() { 
        return this.num_plumes;
    }

    is_ready() { 
        return this.ready;
    }

    is_masked(index) { 
        return this.mask[index];
    }

    nudge() { 
        this.dispatcher.dispatchEvent(event);
    }

    reset_mask() { 
        this.masked = false; 
        this.mask = Array.apply(null, Array(this.content.length)).map(Number.prototype.valueOf,0);
        this.nudge();
    }
}

// Class object representing a given view. The view is the basic building block for 
// the visual interface, views host apps and load data which is displayed by the app.
// the view properties are controlled by the sidebar. A view must be built on a data 
// filter and given a number 0 - 3 
class View { 
    constructor(view,filter_index,view_index) { 
        // is the view currently rendered 
        this.rendered = false; 

        this.locked = false; 

        let self = this;
        // the view object must be passed a DOM object on creation, thus actual 
        // creation of the view element is not the responsibilty of the view class 
        // the view class merely attaches functionality to an already existing object
        this.view = view; // the DOM object that the view is on 
        this.$view = $(this.view) // jquery 

        // make the border of the view show the data filter this view is being built on 
        this.$view.css('border-color',FILTER.COLORS[filter_index]);

        // get the width and height of the view
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        this.toolbar = document.createElement('div'); 
        this.$toolbar = $(this.toolbar); 
        this.$toolbar.addClass('toolbar')
            .css('width',this.width)
            .css('height','40px');  

        // establish and attach the plate 
        this.plate = document.createElement('div'); 
        this.$plate = $(this.plate); 
        this.$plate.addClass('plate')
            .css('width',this.width)
            .css('height',parseInt(this.height) - parseInt(this.$toolbar.css('height')));  

        
        this.$select = $('<select class="view-filter"> \
            <option value="0">Filter 1</option> \
            <option value="1">Filter 2</option> \
            <option value="2">Filter 3</option> \
            <option value="3">Filter 4</option> \
            </select>').change(function() { 
            let val = $(this).val(); 
            // $(this).css('background-color',FILTER.COLORS[val]);
            // let view = $(this).parent().parent();
            self.change_filter(val);

            if (session.state == STATE.SINGLE_VIEW) { 
                session.select_filter(val);
            }
        });

        this.$select.val(filter_index);
        this.$select.css('background-color',FILTER.COLORS[filter_index]);


        this.$edit = $('<div class="view-edit" data-value="' + view_index +'"> edit </div>')
            .click(function(event) {
                if ($(event.target).hasClass('active')) { 
                    return; 
                }
                $('.view-edit.active').removeClass('active');
                $(event.target).addClass('active');
                session.select_view($(event.target).attr('data-value'));
        });

        this.$toolbar.append(this.$edit)
            .append(this.$select);
        
        // the functional dimensions for an app 
        this.app_width = this.$plate.css('width'); 
        this.app_height = this.$plate.css('height');

        this.$view.append(this.toolbar);
        this.$view.append(this.plate);

        // the current visual app being displayed on the view 
        this.app = null; 
        this.app_loaded = false; 

        // the data currently loaded in the view 
        this.data = session.filters[filter_index]; 
        this.event_listener = this.data.dispatcher; 

        // let self = this;
        this.event_listener.addEventListener('data_load', function () { 
            self.render();
        })
        
        // index to uniquely reference this view
        this.filter_index = filter_index; 

        this.view_index = view_index;
    }

    // mounts the new app onto the view 
    load_app(new_app) { 
        if (new_app.is_mounted()) { 
            return -1; 
        }

        if (this.app) { 
            this.app.unmount(); 
        }

        // establish new app and link it with the view
        new_app.mount(this); 
        this.app = new_app; 
        
        // the app has been loaded into the view
        this.app_loaded = true; 
        return 0; 
    }

    // hides the app from the view
    unload_app() { 
        // if there is no app loaded then we don't have anything to do 
        if (!this.app) { 
            return; 
        }

        this.app.hide(); 
        this.app.unmount();
        this.app = null; 
        this.app_loaded = false; 
    }

    // load data from the database into the view context
    load_data(data) { 

        this.data = data; 
        this.event_listener = this.data.dispatcher; 

        let self = this;
        this.event_listener.addEventListener('data_load', function () { 
            self.render();
        })

        if (this.app) {
            this.app.view_data = this.data; 
        }

        this.data_loaded = false; 
    }

    change_filter(index) { 
        if (index == this.filter_index) {
            return; 
        }
        this.filter_index = index;
        this.$select.css('background-color',FILTER.COLORS[this.filter_index]);
        this.$select.val(this.filter_index);
        
        this.$view.css('border-color',FILTER.COLORS[index]);
        this.load_data(session.filters[index]);
        this.render();

    }

    // attach this view to a DOM view 
    attach(DOM_element) { 
        this.view = DOM_element; 
        this.$view = $(this.view);
    }

    // update the view and re render the app based on new data
    render() { 
        if (this.locked) { 
            return; 
        }
        // get the width and height of the view just to be sure 
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        // if there is data then reload it 
        if (this.data_loaded) { 
            this.data.update(); 
        }

        if (this.app) { 
            this.app.update(this); 
        }
    }

    // refresh the view and corresponding app after a resize 
    refresh() { 
        // get the width and height of the view 
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        this.app_width = this.width; 
        this.app_height = parseInt(this.height) * 0.90; 

        this.$plate.css('width',this.app_width)
            .css('height',this.app_height);

        this.$toolbar.css('width',this.app_width) 
            .css('height',parseInt(this.height) * 0.1);

        // if we have an app update the view 
        if (this.app) { 
            this.app.update(this); 
        }
    }

    // clean the app and remove the 
    clean() { 
        if (this.app) { 
            this.app.clean(); 
        }
    }

    lock() { 
        this.locked = true; 
    }

    unlock() { 
        this.locked = false; 
    }

    deselect() { 
        $('.view-controls').empty();
    }

    select() { 
        if (!this.app) { 
            return; 
        }

        this.$edit.addClass('active');

        let controls = $(this.app.plot_controls());
        $('.view-controls').append(controls);
        this.app.register_controls(); 
    }
}

// bas class for all applications 
class App { 
    constructor() { 
        // start the object with view width
        this.view_width = 0; 
        this.view_height = 0; 
        this.view_data = null; 

        this.view_index = null; 

        this.bgc = 'rgb(255,255,255)';

        // these need to be set by a specific app constructor
        this.stage = null; 
        this.$stage = null; 

        // whether or not this app is attached to a view 
        this.mounted = false; 
        this.color = 0;

        this.built = false; 
    }

    // update the dimensions of the app based on the view
    update(view) { 
        // console.log('update app');
        if (!this.mounted) {
            throw 'cannout update an unmounted app'; 
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 

        if (!this.built) { 
            this.build();
        }

        // console.log(this.scatter);
        // this.clean(); 
        this.render(); 
        this.built = true;
    }

    // mount the app to a view 
    mount(view) { 
        if (this.mounted) {
            throw "App is already mounted";
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 
        this.view_data = view.data; 
        this.view_index = view.view_index; 
        this.mounted = true; 

        // put this apps stage on the view
        view.$plate.append(this.$stage); 
    }

    // unmount the app from a view 
    unmount() { 
        if (!this.mounted) {
            throw "App is not mounted"
        }
        this.view_width = 0; 
        this.view_height = 0; 
        this.view_data = {}; 
        this.mounted = false; 

        this.$stage.remove(); 
    }

    is_mounted() { 
        return this.mounted; 
    }

    lock_view() { 
        session.lock(this.view_index);
    }

    unlock_view() { 
        session.unlock(this.view_index);
    }

    // rendering methods for view controls 
    app_ctrl_color(options) { 

    }

    build() {}
    render() {}
    clean() {}   
    plot_controls() {}
}

const GEO = Object.freeze({
    STAGE_ID : 'geography-app', 
    DECK_ID : 'map-deck',
    SCATTER_ID : 'scatter',
    MAP_STYLES : [ 
        'mapbox://styles/mapbox/streets-v10',
        'mapbox://styles/mapbox/outdoors-v10',
        'mapbox://styles/mapbox/light-v9',
        'mapbox://styles/mapbox/dark-v9',
        'mapbox://styles/mapbox/satellite-v9',
        'mapbox://styles/mapbox/satellite-streets-v10',
        'mapbox://styles/mapbox/navigation-preview-day-v2',
        'mapbox://styles/mapbox/navigation-preview-night-v2',
        'mapbox://styles/mapbox/navigation-guidance-day-v2',
        'mapbox://styles/mapbox/navigation-guidance-night-v2',
    ], 
    MAP_STYLE_ACCESS : [
        2,
        4,
        8,
        3, 
    ],
    MAP_TOKEN : 'pk.eyJ1IjoiamJvb25lIiwiYSI6ImNqa3o2cjVhdTA2OHkzcG0wOHU4OXplNTMifQ.b3gc6bHvJM8MChCUDZQPKw',
    INITIAL_VIEWSTATE : { 
        longitude: 0, 
        latitude: 0, 
        zoom: 1.4, 
        maxZoom: 12, 
        minZoom: 1, 
    }, 
    VIEW_STYLE : { 
        INITIAL : 0, 
        EAGLE : 1, 
        ANGLED : 2,
    }
});

// Map visual application 
class Geo extends App{ 
    constructor() {
        super(); 

        // establish the context for the map 
        this.stage = document.createElement('div');
        this.$stage = $(this.stage); // do not use the Jquery object for this app 
        this.$stage.attr('id',GEO.STAGE_ID);

        this.deck_config = null;
        this.representation = 0;
        this.style = 0;
        this.opacity = 0;
        this.radius = 1;

        this.deck = null;
    }

    // generate data for the deck layer based on the current state of the app
    generate_data() { 
        let self = this;
        // the data array we are generating
        let return_data = [];

        let color_hold = FILTER.COLORS_ARR[this.view_data.index];
        // a color holder to build and store deck colors 
        let color = color_hold; // the default color 

        // alert('litigate');
        // populate the data [x,y,radius,color]
        this.view_data.data().forEach(function(plume,i) { 
            let plume_data = [];
            plume_data.push(parseFloat(plume.p_src_long)); 
            plume_data.push(parseFloat(plume.p_src_lat)); 

            if (self.radius == 0) { 
                plume_data.push(0.5); 
            } else if (self.radius == 1) { 
                plume_data.push(plume.p_total_frp);
            } else if (self.radius == 2) { 
                plume_data.push(plume.p_max_ht/3);
            }

            
            if (self.color == 1) { 
                color = biome_colors_arr[plume.p_biome_id].slice();
            } else if (self.color == 2) { 
                color = region_colors_arr[plume.p_region_id].slice();
            }

            if (self.opacity == 0) { 
                color.push(200);
            } else if (self.opacity == 1) { 
                color.push(plume.p_total_frp);
            } else if (self.opacity == 2) { 
                color.push(plume.p_max_ht);
            }

            
            if (self.view_data.masked) { 
                // alert('litigator');
                
                if (!self.view_data.is_masked(i)) {
                    // color = [0,0,0,100];
                    return;
                }
            } 

            plume_data.push(color); 
            color = color_hold;
            return_data.push(plume_data);

        }); 
        return return_data;
    }

    // generate a new deck layer
    generate_layer(data) { 
        if (this.representation == 0) { 
            return new deck.ScatterplotLayer({
                id: 'scatter', 
                radiusMaxPixels: 8,
                radiusMinPixels: 2,
                pickable: true,
                autoHighlight: true, 
                onHover: function(info){ 
                    // deck.setTooltip('hey');
                    // console.log(info);
                },
                getRadius: function(d) {return d[2] * 100},
                getPosition: function(d) {return [d[0],d[1],0];}, 
                getColor: function(d) {return d[3]},
                data: data,
            });
        } else if (this.representation == 1) { 
            return new deck.ScreenGridLayer({ 
                id: 'grid', 
                data: data, 
                cellSizePixels: 20,
                getPosition: function(d) {return [d[0],d[1],0];}, 
                getWeight: function(d) {return d[2] * 10},
            }); 
        } else if (this.representation == 2) { 
            let layer = new deck.HexagonLayer({ 
                id: 'hexagon', 
                data: data, 
                radius: 70000, 
                pickable: true,
                autoHighlight: true, 

                // coverage: 1, 
                extruded: true,
                elevationScale: 5000, 
                elevationDomain: [10,300],
                // getElevationValue: function(p) { return 10; },
                getPosition: function(d) {return [d[0],d[1]];}, 
                // getElevationValue: this.elev,
            }); 

            let divider = 1; 

            if (this.radius == 1) { 
                divider = 30;
            } else if (this.radius == 2) { 
                divider = 50;
            }

            let self = this;
            layer.__proto__._onGetSublayerElevation = function(t) { 
                let num = 0;
                
                t.points.forEach(function(pt) { 
                    if (!self.radius) { 
                        num++;
                    } else {
                        num+= pt[2]; ///divider;
                    }
                   
                    
                });
                // return (num/(t.points.length)) * 5;
                return num * (1/divider); 
            }

            // layer.__proto__._onGetSublayerColor = function(t) { 
            //     let num = 0;
            //     t.points.forEach(function(pt) { 
            //        num+= pt[2]/divider;
                    
            //     });
            //     // return num/(t.points.length) * 5;
            //     return num; 
            // }

            // layer.props._proto_.getElevationValue = t => 500;
            return layer;
        }
    }

    generate_viewstate() { 
        // alert(this.representation);
        // if this is the initial view style there is only one that it could be 
        if (this.deck == null) { 
            return GEO.INITIAL_VIEWSTATE;
        } 
        
        // if it is not the inital view style we need to determine what to base 
        // the view off of i.e. we must already have a built deck with a viewstate
        if (this.deck == null) throw 'VIEW GENERATION ERROR: Deck not built';

        let defaulted = this.deck.viewState['default-view'] != null; // do we have a defaulted (changed) viewstate

        let src = null; 
        if (defaulted) { 
            src = this.deck.viewState['default-view'];
        } else { 
            src = this.deck.viewState;
        }

        // get the current viewstate 
        let current_vs = {
            longitude: src.longitude, 
            latitude: src.latitude, 
            zoom: src.zoom, 
            maxZoom: src.maxZoom, 
            minZoom: src.minZoom, 
        }

        
        if (this.representation != 2) { 
            current_vs.pitch = 0;
            current_vs.bearing = 0;
        } else { 
            current_vs.pitch = 40.5;
            current_vs.bearing = -27;
        }

        return current_vs;
    }

    clean_deck() { 
        if (this.deck) { 
            $(this.deck._map.map._container).remove();
            $('#' + this.deck.props.id).remove();
            this.deck.finalize();
        }
    }

    elev(d) { 
        return 500;
    }

    // build the deck object 
    build() { 
        this.built = false;
        // store dimensions 
        this.$stage.css('width',this.view_width);
        this.$stage.css('height',this.view_height);
        let self = this;

        let use_viewstate = this.generate_viewstate();
        this.deck_view = new MapView({id: 'primary-map'});

        // create the deck configuration 
        this.deck_config = { 
            // unique identifier for deck 
            id : GEO.DECK_ID, 

            // attach deck to the stage
            container : GEO.STAGE_ID,

            // views : deck_view,

            // establish view state 
            viewState : use_viewstate,

            // default to satellite I suppose 
            mapboxApiAccessToken: GEO.MAP_TOKEN,
            mapStyle: GEO.MAP_STYLES[GEO.MAP_STYLE_ACCESS[this.style]],
        }

        // aquire the data 
        let deck_data = this.generate_data();

        // create the scatter layer to overlay on the deck 
        this.deck_layer = this.generate_layer(deck_data);

        this.clean_deck(); 

        this.deck_config.layers = [this.deck_layer];
        this.deck = new deck.DeckGL(this.deck_config);

        // console.log(this.deck);


        // this.built = true;

    }


    render() { 
        // can't render if it's not built 
        if (!this.built) { 
            this.built = true;
            return;
        }

        // alert('how');
        let deck_data = this.generate_data();

        this.deck_layer = this.generate_layer(deck_data); 


        // let use_viewstate = 
        let use_viewstate = this.generate_viewstate();

        this.deck.setProps({
            layers : [this.deck_layer],
            viewState : use_viewstate,
        })  
        
    }

    hex_aggregator({data, radius, getPosition}, viewport) { 
        // get hexagon radius in mercator world unit
        const radiusInPixel = getRadiusInPixel(radius, viewport);
        
        // add world space coordinates to points
        const screenPoints = [];
        for (const pt of data) {
            screenPoints.push(
            Object.assign(
                {
                screenCoord: viewport.projectFlat(getPosition(pt))
                },
                pt
            )
            );
        }
        
        const newHexbin = hexbin()
            .radius(radiusInPixel)
            .x(d => d.screenCoord[0])
            .y(d => d.screenCoord[1]);
        
        const hexagonBins = newHexbin(screenPoints);
        
        return {
            hexagons: hexagonBins.map((hex, index) => ({
            centroid: viewport.unprojectFlat([hex.x, hex.y]),
            points: hex,
            index
            }))
        };
    }

    clean() { 
        if (this.svg) { 
            this.svg.remove(); 
            this.canvas.remove();
        }
    }

    plot_ctrl_style() { 
        return `<dl class="dropdown view-dropdown"> 
            <dt data-target="0">
                <a href="#" data-target="0" id="region-text">
                    <span class="view-drop-text 0"> plot-type </span>    
                </a>
            </dt>
            <dd>
                <ul class='view-drop' id='geo-style-drop' data-target="2">
                    <li>
                        <input type="checkbox" data-code="0" value="Africa" />Africa</li>
                    <li>
                        <input type="checkbox" data-code="1" value="Australia" />Australia</li>
                    <li>
                        <input type="checkbox" data-code="2" value="Southwest Eurasia" />Southwest Eurasia</li>
                    <li>
                        <input type="checkbox" data-code="3" value="North America" />North America</li>
                    <li>
                        <input type="checkbox" data-code="4" value="Boreal Eurasia" />Boreal Eurasia</li>
                    <li>
                        <input type="checkbox" data-code="5" value="South America" />South America</li>
                    <li>
                        <input type="checkbox" data-code="6" value="South Asia" />South Asia</li>
                </ul>
            </dd>
        </dl>`;
    }

    plot_controls() { 
        // let str = this.plot_ctrl_style();
        let str = `<div class="plot-type">   
            Plot Type: 
            <select class="plot-select plot-selection">  
                <option value="0" selected="selected">Geography</option> 
                <option value="1">Scatter</option> 
                <option value="2">Pie</option> 
            </select> 
            <div class="plot-options"> 
                <span class="plot-selection-label"> style </span> 
                <select class="plot-style"> 
                    <option value="0" selected="selected">Vanilla</option> 
                    <option value="1">Satellite</option> 
                    <option value="2">Map</option> 
                    <option value="3">Nightime</option> 
                </select> <br> 
                <span class="plot-selection-label"> data representation </span>
                <select class="plot-representation"> 
                    <option value="0" selected="selected">Scatter</option> 
                    <option value="1">Grid</option> 
                    <option value="2">Pillars</option> 
                </select> <br> 
                <span class="plot-selection-label"> color </span> 
                <select class="plot-color"> 
                    <option value="0" selected="selected">None</option> 
                    <option value="1">Biome</option> 
                    <option value="2">Region</option> 
                </select> <br>
                <span class="plot-selection-label"> radius </span> 
                <select class="plot-radius"> 
                    <option value="0" selected="selected">Uniform</option> 
                    <option value="1">FRP</option> 
                    <option value="2">Plume Height</option> 
                </select> <br>
                <span class="plot-selection-label"> opacity </span> 
                <select class="plot-opacity"> 
                    <option value="0" selected="selected">Uniform</option> 
                    <option value="1">FRP</option> 
                    <option value="2">Plume Height</option> 
                </select> <br>
            </div> 
        </div>`

        return str; 
    }

    register_controls() { 

        let self = this;
        $('.plot-select').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.select_view(session.selected_view);
        });

        $('.plot-color').change(function() { 
            self.color = $(this).val(); 
            self.render();
        }).val(this.color);

        $('.plot-representation').change(function() { 
            self.representation = $(this).val(); 
            self.render();
            
        }).val(this.representation);

        $('.plot-style').change(function() { 
            self.style = $(this).val(); 
            self.build();
        }).val(this.style);

        $('.plot-radius').change(function() { 
            self.radius = $(this).val(); 
            self.render();
        }).val(this.radius);

        $('.plot-opacity').change(function() { 
            self.opacity = $(this).val(); 
            self.render();
        }).val(this.opacity);
    }

}


// // Map visual application 
class Plot extends App{ 
    constructor(x_conf,y_conf) {
        super(); 
        // if (x_conf == y_conf) throw 'please stop';
        // establish the context for the map 
        this.stage = document.createElement('div'); // DOM object 
        this.$stage = $(this.stage); // jquery object 
        this.$stage.attr('id','chart'); // assign it an id so we can handle 

        this.data = []; 
        this.layout = {};
        this.conf =  { 
            displaylogo : false, 
            showLink : false, 
            modeBarButtonsToRemove : ['toImage','editInChartStudio']
        }

        this.x_conf = x_conf; 
        this.y_conf = y_conf; 

        this.bgc = 'rgb(255,255,255)';
        this.plot = true;
    }

    render() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);

        let self = this;

        this.stage.on('plotly_selected',function(event) {
            // alert('selection');
            let points = event.points;
            let old_mask = self.view_data.mask.slice(); 
            let new_mask = old_mask.map(_ => 0);

            points.forEach(function(point) { 
                new_mask[point.customdata] = 1; 
            })


            if (self.view_data.masked) { 
                self.view_data.mask = new_mask.map((x,i) => { 
                    return x & old_mask[i];
                });
            } else { 
                self.view_data.mask = new_mask;
            }

            self.lock_view();
            self.view_data.masked = true; 
            self.view_data.nudge();
            self.unlock_view();
        })
    }

    clean() { 
        this.$stage.css('width',0); 
        this.$stage.css('height',0);
    }

    setData() { 
        alert('Plot not fully implemented');
    }

    register_controls() { 
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.change_view(session.selected_view);
        });
    }
}

class Pie extends Plot { 
    constructor(x_conf,y_conf) { 
        super(x_conf,y_conf); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let value = Array.apply(null, Array(17)).map(Number.prototype.valueOf,0);

        // alert(value);    
        let self = this; 
        let opacity = [];

        this.view_data.data().forEach(function(plume,i) { 

            if (self.view_data.masked) { 
                if (!self.view_data.is_masked(i)) {
                    return;
                }
            }

            if (self.x_conf == 0) {
                value[plume.p_biome_id]++;  
            } else if (self.x_conf == 1) { 
                value[plume.p_region_id]++;
            }
             
        }); 

        let v = []; 
        let b = [];
        let c = []; 
        let custom = [];

        value.forEach(function(p,i) { 
            if (value[i] == 0) {
                return
            }

            v.push(value[i]); 

            if (self.x_conf == 0) { 
                b.push(biome_names[i]);
                c.push(biome_colors[i]);
                custom.push(i);
            } else if (self.x_conf == 1) { 
                b.push(region_names[i]);
                c.push(region_colors[i]);
                custom.push(i);
            }
            
        })

        trace1 = {
            type: 'pie',
            values: v,
            labels: b,
            customdata: custom,
            marker : {
                // color : 'rgb(246,149,149)', 
                colors : c,
            }
        };

    
        layout = { 
            height: this.view_height * 0.5, 
            width: this.view_width * 0.5, 
        }
        this.data = [trace1];
        this.layout = layout; 
    }

    render() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);

        let self = this;

        this.stage.on('plotly_click',function(event) {
            let points = event.points;
            let old_mask = self.view_data.mask.slice(); 
            let new_mask = old_mask.map(_ => 0);

            self.view_data.data().forEach(function(plume,i) {
                if (self.x_conf) { 
                    if (plume.p_biome_id == points[0].customdata[0]) { 
                        new_mask[i] = 1;
                    }
                } else { 
                    if (plume.p_biome_id == points[0].customdata[0]) { 
                        new_mask[i] = 1;
                    }
                }
                
            });
            
            if (self.view_data.masked) { 
                self.view_data.mask = new_mask.map((x,i) => { 
                    return x & old_mask[i];
                });
            } else { 
                self.view_data.mask = new_mask;
            }

            self.lock_view();
            self.view_data.masked = true; 
            self.view_data.nudge();
            self.unlock_view();
        })
    }

    plot_controls() { 
        let str = '<div class="plot-type">   \
        Plot Type: \
        <select class="plot-selection">  \
            <option value="0">Geography</option> \
            <option value="1">Scatter</option> \
            <option value="2" selected="selected">Pie</option> \
        </select> \
        <div class="plot-options"> \
            variable \
            <select class="plot-variable"> \
                <option value="0" selected="selected">Biome</option> \
                <option value="1">Region</option> \
            </select> \
        </div> \
    </div>'

    return str; 
    }

    register_controls() { 
        let self = this;
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            // alert(val);
            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.select_view(session.selected_view);
        });

        $('.plot-variable').change(function() { 
            self.x_conf = $(this).val(); 
            self.render();
        });
    }
}

class ScatterPlot extends Plot { 
    constructor(x_conf,y_conf) { 
        super(x_conf,y_conf); 
        this.opacity = 1;
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 

        let x =[];
        let xstr = '';
        let ystr = ''; 
        let y =[]; 

        let colors = []; 
        let data = [];
        let opacity = []; 
        let self = this;

        this.view_data.data().forEach(function(plume,i) { 

            let opt = plume.p_avg_opt_depth; 
            let ab = plume.p_avg_ss_albedo; 
            if (!opt || !ab) { 
                return; 
            }

            if (self.view_data.masked) { 
                if (self.view_data.is_masked(i)) { 
                    // opacity.push(1); 
                } else {
                    return;
                }
            }
            
            
            if (self.x_conf == 0) { 
                x.push(plume.p_total_frp); 
                xstr = 'total frp (kW)';
            } else if (self.x_conf == 1) { 
                x.push(plume.p_max_ht); 
                xstr = 'max plume height (m)';
            } else if (self.x_conf == 2) { 
                x.push(plume.p_avg_opt_depth[1]);
                xstr = 'AOD';
            } else {
                x.push(plume.p_avg_ss_albedo[1]);
                xstr = 'SS Albedo';
            }

            if (self.y_conf == 0) { 
                y.push(plume.p_total_frp); 
                ystr = 'total frp (kW)';
            } else if (self.y_conf == 1) { 
                y.push(plume.p_max_ht); 
                ystr = 'max plume height (m)';
            } else if (self.y_conf == 2) { 
                y.push(plume.p_avg_opt_depth[1]);
                ystr = 'AOD';
            } else {
                y.push(plume.p_avg_ss_albedo[1]);
                ystr = 'SS Albedo';
            }
            
            if (self.color == 2) {
                colors.push(region_colors[plume.p_region_id])
            } else { 
                colors.push(biome_colors[plume.p_biome_id])
            }
               
            // if (self.view_data.is_masked(i)) { 
            //     opacity.push(1); 
            // } else {
            //     opacity.push(0.1);
            // }
            data.push(i);
        }); 

        let use_color = null; 

        if (this.color != 0) { 
            use_color = colors; 
        } else { 
            use_color = FILTER.COLORS[this.view_data.index];
        }

        let use_opacity = this.opacity; 

        // if (this.view_data.masked) { 
        //     use_opacity = opacity; 
        // } else { 
        //     use_opacity = 1; 
        // }
        trace1 = {
            type: 'scattergl',
            x: x,
            y: y,
            customdata: data,
            mode: 'markers',
            marker : {
                color : use_color, 
                opacity : use_opacity,
                // color : colors,
            }
        };

    
        layout = { 
            // showlegend: false,
            // hovermode: 'closest',
            // height: 500,
            margin: {
                l: 70,
                r: 10,
                b: 80,
                t: 10,
                pad: 10,
            },
            xaxis : {
                title : xstr, 
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals, 
            },
            yaxis : { 
                title : ystr,
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals,  
            },
        };
        this.data = [trace1];
        this.layout = layout; 
    }

    plot_controls() { 
        let str = `<div class="plot-type">   
            Plot Type: 
            <select class="plot-selection">  
                <option value="0">Geography</option> 
                <option value="1" selected="selected">Scatter</option> 
                <option value="2">Pie</option> 
            </select> 
            <div class="plot-options"> 
                x 
                <select class="plot-x"> 
                    <option value="0" selected="selected">FRP</option> 
                    <option value="1">Height</option> 
                    <option value="2">AOD</option> 
                    <option value="3">Albedo</option> 
                </select> <br>
                y 
                <select class="plot-y"> 
                    <option value="0">FRP</option> 
                    <option value="1" selected="selected">Height</option> 
                    <option value="2">AOD</option> 
                    <option value="3">Albedo</option> 
                </select> <br> 
                color 
                <select class="plot-color"> 
                    <option value="0" selected="selected">None</option> 
                    <option value="1">Biome</option> 
                    <option value="2">Region</option> 
                </select> <br>
                opacity
                <div class="slidecontainer" id="me">
                    <input type="range" min="1" max="100" value="100" class="slider" id="myRange">
                </div>
            </div> 
        </div>`

        return str; 
    }

    register_controls() { 
        let self = this;
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            // alert(val);
            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.select_view(session.selected_view);
        });

        $('.plot-color').change(function() { 
            self.color = $(this).val(); 
            self.render();
        });

        $('.plot-x').change(function() { 
            self.x_conf = $(this).val(); 
            self.render();
        });

        $('.plot-y').change(function() { 
            self.y_conf = $(this).val(); 
            self.render();
        });

        $('#me').change(function() { 
            self.opacity = $(this).find('input').val()/100;
            
            self.render();
        });
    }
}

// let months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

// class ScatterPlot2 extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 
//         let trace1 = {}; 
//         let trace2 = {}; 
//         let layout = {}; 
//         let x = Array.apply(null, Array(12)).map(Number.prototype.valueOf,0);
//         let y = Array.apply(null, Array(5000)).map(Number.prototype.valueOf,0);
//         let x1 = x; 
//         let y1 = y; 
//         // let colors = []; 

//         this.view_data.forEach(function(plume,i) { 
//             let month = plume.p_date.split('-')[1];
//             if (plume.p_avg_ss_albedo == null) {
//                 return; 
//             }
//             let frp = plume.p_avg_ss_albedo[1]*50; 
//             frp = Math.round(frp); 
//             x[frp] += 1; 
//             // let ht = Math.round(plume.p_med_ht); 
//             // console.log(ht); 
//             // if (plume.p_biome_id == 0) {
//             //     x[ht] += 1;
//             // } else if (plume.p_biome_id == 4) { 
//             //     y[ht] += 1; 
//             // }
//             // x.push(plume.p_total_frp); 
//             // y.push(plume.p_max_ht);    
//             // colors.push(biomecolors[plume.p_biome_id])   
//         }); 

//         // let x = [];
//         // for (var i = 0; i < 12; i ++) {
//         //     x[i] = Math.random();
//         // }

//         trace1 = {
//             y: x,
//             // x: months, 
//             type: 'bar',
//             // autobinx: false, 
//             // xbins : { 
//             //     start : 0, 
//             //     end : 11, 
//             //     size: 1,
//             // }

//         };
//         // var data = [trace];
//         // Plotly.newPlot('myDiv', data);

//         // alert(x); 
//         // alert(y); 

//         // trace1 = {
//         //     type: 'scatter',
//         //     x: x,
//         //     y: y,
//         //     mode: 'markers',
//         //     marker : {
//         //         // color : 'rgb(246,149,149)', 
//         //         color : colors,
//         //     }
//         // };

    
//         // layout = { 
//         //     title: 'Max Plume Height vs Biome',
//         //     showlegend: false,
//         //     hovermode: 'closest',
//         //     xaxis : {
//         //         title : 'Total FRP', 
//         //         // tickmode : "array",   
//         //         // ticktext : biomebins, 
//         //         // tickvals : biomevals, 
//         //     },
//         //     yaxis : { 
//         //         title : 'Max Plume Height (m)', 
//         //     },
//         //     sliders: [{
//         //         // pad: {t: 30},
//         //         currentvalue: {
//         //           xanchor: 'right',
//         //           prefix: 'color: ',
//         //           font: {
//         //             color: '#888',
//         //             size: 20
//         //           }
//         //         }
//         //     }]
//         // }

//         // trace1 = { 
//         //     x: x, 
//         //     // x : x1,
//         //     type: 'histogram', 
//         //     color: 'red',
//         //     xbins: { 
//         //         end: 5000, 
//         //         size: 0.06, 
//         //         start: -3.2
            
//         //       },

//         //     // autobinx : false,
//         // }

//         // trace2 = {
//         //     x: y, 
//         //     // x: x1, 
//         //     type: 'histogram',
//         //     color: 'blue',

//         // }

//         layout = { 
//             title : 'Total Fire Radiative Power by Month', 
//             bargap: 0.05, 
//             // bargroupgap: 1, 
//             // barmode: 'stack'
//         }
//         this.data = [trace1];
//         this.layout = layout; 
//     }
// }

// class ParallelPlot extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 
//         let trace1 = {}; 
//         let layout = {}; 
//         let c1 = [];
//         let c2 = []; 
//         let c3 = [];
//         let c4 = []; 
//         let colors = []; 

//         this.view_data.forEach(function(plume,i) { 

//             c1.push(plume.p_max_ht); 
//             c2.push(plume.p_total_frp); 
//             c3.push(plume.p_perimeter); 
//             c4.push(plume.p_max_angstrom);   
//             colors.push(biomecolors[plume.p_biome_id]); 
//         }); 

//         trace1 = {
//             type: 'parcoords',
//             line: {
//                 color: biomecolors[10],
//                 // color: colors,  
//                 opacity: 0.5,
//             },
            
//             dimensions: [{
//             //   range: [1, 5],
//             //   constraintrange: [1, 2],
//               label: 'Total FRP',
//               values: c2
//             }, {    
//             //   range: [1,5],
//               label: 'Plume Height',
//               values: c1,
//             //   tickvals: [1.5,3,4.5]
//             }, {
//             //   range: [1, 5],
//               label: 'Plume Perimeter',
//               values: c3,
//             //   tickvals: [1,2,4,5],
//             //   ticktext: ['text 1','text 2','text 4','text 5']
//             }, {
//             //   range: [1, 5],
//               label: 'Max Angstrom',
//               values: c4
//             }]
//           };

//         layout = { 
//             title: 'Parallel Coordinates',
//         }

//         this.data = [trace1];
//         this.layout = layout; 
//     }
// }


// class Map extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 

//         // let data_instance = []; 
//         let latitudes = []; 
//         let longitudes = []; 
//         let trace1 = {}; 
//         let layout = {}; 
//         let colors =[]; 

//         this.view_data.forEach(function(plume,i) { 
//             latitudes.push(plume.p_src_lat); 
//             longitudes.push(plume.p_src_long);   
//             colors.push(biomecolors[plume.p_biome_id]);  
//         }); 

//         trace1 = {
//             type: 'scattergeo',
//             locationmode: 'ISO-3',
//             lat: latitudes,
//             lon: longitudes,
//             marker: {
//                 size: 3,
//                 // color: 'rgb(246,149,149)',
//                 // opacity: 0.05, 
//                 color: colors,
//             }
//         };

//         layout = { 
//             // title: 'Map',
//             showlegend: false,
//             geo: {
//                 scope: 'world',
//                 showocean: true, 
//                 oceancolor: 'rgb(242,242,242)',
//                 showcoastlines: false,
//                 coastlinewidth: 0, 
//                 coastlinecolor: 'rgb(255,255,255)',
//                 showland: false,
//                 landcolor: 'rgb(255, 255, 255)',
//                 subunitwidth: 1,
//                 countrywidth: 1,
//                 subunitcolor: 'rgb(255,255,255)',
//                 countrycolor: 'rgb(255,255,255)'
//             },
//         }

//         this.data = [trace1];
//         this.layout = layout; 

//         // let s = document.getElementById('chart'); 

//         // this.stage.on('plotly_selected', function(eventdata) { 
//         //     latitudes = []; 
//         //     longitudes = []; 
//         //     console.log(eventData.points); 
//         //     eventData.points.forEach(function(pt) {
                
//         //         colors[pt.pointNumber] = color1;
//         //       });
//         //     Plotly.newPlot(this.stage,this.data,this.layout,this.conf);
//         // }); 
//     }
// }

