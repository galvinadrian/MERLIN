// The Instance class that manages all the apps and views in a given 
// session of Merlin. The Instance targets a single data filter and a single 
// view at a given time, selected from within it's internal storage. All 
// operations from the sidebar apply to the selected data filter and view 
// respectively based on the sidebar tool used 
//
// Author - Jarod Boone

// the global session variable that will be used to do virtually all manipulation
let session = {};

// state constants 
const STATE = Object.freeze({
    SINGLE_PLUME : 0, 
    SINGLE_VIEW : 1, 
    DUO_VIEW : 2, 
    TRI_VIEW : 3, 
    QUAD_VIEW : 4,  
})

// view constants for indexing and referencing views 
const VIEW = Object.freeze({ 
    ID : Object.freeze({
        MAIN : 'view1', 
        INDEX : function (index) { 
            return 'view' + (index + 1); 
        },
    }),
    SINGLE_VIEW : Object.freeze({
        WIDTH: '79vw',
        HEIGHT: '90vh', 
        TOP: '1vh', 
        RIGHT: '0.5vw',
    }), 
    QUAD_VIEW : Object.freeze({
        WIDTH: '39.25vw', 
        HEIGHT: '44.5vh', 
        TOP: '46.5vh', 
        RIGHT: '40.25vw',
        NO_RIGHT: '0.5vw', 
        NO_TOP: '1vh',
    }),
    DROPS : [
        '#geo-style-drop',
    ]
})

// constants for dealing with the filters
const FILTER = Object.freeze({ 
    // filter colors by index
    COLORS : [
        'rgb(0, 69, 160)',
        'rgb(6,112,183)',
        'rgb(5,193,246)',
        'rgb(37,221,186)'
    ], 

    COLORS_ARR : [
        [0, 69, 160],
        [6,112,183],
        [5,193,246],
        [37,221,186]
    ],

    // filter button and highlight ids by index 
    SELECTION_ID : [
        ['#fb1','#fh1'],
        ['#fb2','#fh2'],
        ['#fb3','#fh3'],
        ['#fb4','#fh4']
    ],

    // filter names by index 
    NAME : [
        'Filter 1', 
        'Filter 2', 
        'Filter 3', 
        'Filter 4',
    ], 

    // index constants 
    CHANNEL_1 : 0, 
    CHANNEL_2 : 1, 
    CHANNEL_3 : 2, 
    CHANNEL_4 : 3, 
})

// the sets regarding biomes and  
let addedBiomes = new Set([]); 
let addedRegions = new Set([]); 

// the instance class represents a session of MERLIN. This manages the 
// type of stage we are using as well as the sidebar controls for given 
// session type. Also data filters that have been saved are kept in a session 
// The general pattern for an instance is as follows
// 
//    - Create the Instance 
//    - Set the desired state 
//    - fetch data for each data index you will use 
//    - load instance 
// 
class Instance { 
    constructor() { 
        // the current state of the instance. This is how many view ports are 
        // visible in the program
        this.state = STATE.SINGLE_VIEW; 

        // the current view that is being edited by the instance 
        this.selected_view = 0; // default view 1 

        // the current filter that is being edited by the instance 
        this.selected_filter = FILTER.CHANNEL_1; // default channel 1

        // the current views that have been loaded into this instance
        this.views = []; 

        // the current views that are visible in the current main viewport 
        this.visible_views = [null,null,null,null];

        // the data filters that are loaded into the instance 
        this.filters = [null,null,null,null]; 

        // the currently added biomes loaded on the instance
        this.biomes = new Set([]); // {} ==> all biomes
        this.regions = new Set([]); // {} ==> all regions

        // loading functionality
        this.loading_icon = false; 
        this.load_count = 0;
    }

    // this method should be called before anything is done with the instance, the 
    // instance will load at some point after this method is called. The init method 
    // populates all of the data filters 
    init() { 
        let self = this;

        // create a host filter to seed the other filters with 
        let father_filter = new Filter(this.biomes,this.regions,true,0); 

        // when the father filter finishes loading data populate the other data filters 
        // and then load the instance (i.e. render it)
        father_filter.dispatcher.addEventListener('data_load',function() {
            for (let i = 0; i < 4; i++) { 
                self.filters[i] = new Filter(this.biomes,this.regions,false,i); 
                self.filters[i].content = father_filter.content.slice();
                self.filters[i].mask = father_filter.mask.slice();
            }

            // once we have populated the filters we can load the instance
            self.load();
        })
    }

     // load this instance and render it this assumes that the state has already
    // been set appropriately. Loads into main viewport or "stage"
    load() { 
        // clear any views that currently exist
        $('.view').each(function () { 
            $(this).remove(); 
        })

        if (this.state == STATE.SINGLE_VIEW) { 
            // append a single view 
            let view = $('<div></div>');  // generate the jquery view
            $('.stage').append(view); // attach the view to the stage 

            // initialize the view 
            view.attr('class','view')
                .attr('id',VIEW.ID.MAIN) // single view on main view
                .css('right',VIEW.SINGLE_VIEW.RIGHT)
                .css('top',VIEW.SINGLE_VIEW.TOP)
                .css('width',VIEW.SINGLE_VIEW.WIDTH) // 
                .css('height',VIEW.SINGLE_VIEW.HEIGHT);

            // create a new view object, add a geographic app to it and render 
            this.visible_views[this.selected_view] = new View(document.getElementById(VIEW.ID.MAIN),this.selected_filter,0); 

            // add an app to the selected view 
            let app = new Geo(); 

            // load the app into this view 
            this.visible_views[this.selected_view].load_app(app);

            // render the view for the first time
            this.visible_views[this.selected_view].render(); 

        } else if (this.state == STATE.QUAD_VIEW) { 
            for (let i = 0; i < 4; i++) { 

                // append the views
                let view = $('<div></div>');  // generate the jquery view
                let id = VIEW.ID.INDEX(i); // generate a unique id for this view
                $('.stage').append(view); // attach the view to the stage 

                let right = !(i%2) ? VIEW.QUAD_VIEW.RIGHT : VIEW.QUAD_VIEW.NO_RIGHT; 
                let top = !(i < 2) ? VIEW.QUAD_VIEW.TOP : VIEW.QUAD_VIEW.NO_TOP; 

                // initialize the view 
                view.attr('class','view')
                    .attr('id',id)
                    .css('right',right)
                    .css('top',top)
                    .css('width',VIEW.QUAD_VIEW.WIDTH)
                    .css('height',VIEW.QUAD_VIEW.HEIGHT);

                // create a new view object, add a geographic app to it and render 
                this.visible_views[i] = new View(document.getElementById(id),FILTER.CHANNEL_1,i); 

                // add an app to the selected view 
                let app = null; 
                if (i == 0 || i == 2) { 
                    app = new ScatterPlot(0,1); // view 0 and view 2 are scatter plots
                } else if (i == 1) { 
                    app = new Pie(0,0); // view 1 is a pie chart
                } else { 
                    app = new Geo(); // view 3 is a map
                }

                // load the app into the view 
                this.visible_views[i].load_app(app);

                // render the view for the first time
                this.visible_views[i].render(); 

            }  
        }
        
        // clear the view controls 
        this.clear_view_controls(); 

        // select the first view to begin the data instance
        this.visible_views[this.selected_view].select();
    }

    // change the state of this instance to the given state
    change_state(state) { 
        this.state = state; 
        this.load(); // load the instance into the main viewport
    }

    // select the filter at the given index to be the current filter of the instance
    select_filter(new_index) { 
        if (new_index < 0 || new_index > 3) { 
            throw 'filter index is out of bounds';
        }

        // if we are already targeting the filter we want to select then we don't
        // need to do anything. Hooray
        if (this.selected_filter == new_index) { 
            return;
        }

        // target the old filter elemets on the sidebar and remove their active
        // classes for styling
        let old_ids = FILTER.SELECTION_ID[this.selected_filter];
        $(old_ids[0]).removeClass('active'); 
        $(old_ids[1]).removeClass('active'); 

         // set the targeted filter of this session to the new filter 
         this.selected_filter = new_index; 

        // target the new filter elements on the sidebar and add active classes 
        // for styling. Gotta look pretty 
        let new_ids = FILTER.SELECTION_ID[this.selected_filter]; 
        $(new_ids[0]).addClass('active'); 
        $(new_ids[1]).addClass('active'); 

        // set the filter control box color to match the newly selected filter
        let color = FILTER.COLORS[this.selected_filter]; 

        $('.noUi-connect').css('background',FILTER.COLORS[this.selected_filter]);
        // $('.toolbar').find().val(new_index).css('background',FILTER.COLORS[this.selected_filter]);
        // $('.noUi-connect').each(function(i,slider) {
        //     console.log(slider);
        //     $(slider).css('background',FILTER.COLORS[this.selected_filter]);
        // })
        // $('#data-tab').css('border-color',color); 

        // load the values of this filter into the sidebar 
        this.filters[this.selected_filter].load();
    }

    // select the view at the given index to be the current view of the instance
    // selecting a view will populate the view controls with appropriate controls
    select_view(new_index) { 
        if (new_index < 0 || new_index > 3) { 
            throw 'view index is out of bounds';
        }

        // deselect the current view (which must be different then the one we
        // are trying to select at this point)
        this.this.clear_view_controls();

        // set the view this instance is targeting to the new view 
        this.selected_view = new_index; 

        // select the new view from within storage... that was easy! 
        this.visible_views[this.selected_view].select();
    }

    // clears the view controls 
    clear_view_controls() { 
        $('.view-controls').empty();
    }

    // load data to the targeted data filter
    fetch_data() { 
        this.filters[this.selected_filter].update(this.biomes,this.regions); 
    }

    // load the given app onto the targeted view and render it  
    load_app(app) { 
        this.visible_views[this.selected_view].load_app(app);
        this.visible_views[this.selected_view].render();  
    }

    // refresh the views of the instance
    refresh() { 
        this.visible_views.forEach(function (view) { 
            if (view) { 
                view.refresh(); 
            }
        });
    }

    // increment the loading icon count and show the loading icon
    show_loading_icon () { 
        this.load_count++;

        if (this.loading_icon) { 
            return;
        }

        $('.stage').css('opacity',0.5);
        $('.loader').css('border-top-color',FILTER.COLORS[this.selected_filter]);
        $('.loader').addClass('active');
        $('.loader').css('opacity',1); 
        
        this.loading_icon = true;
    }

    // decrement the loading icon count and hide the loading icon 
    hide_loading_icon() { 
        this.load_count--; 

        if (this.load_count != 0) { 
            return;
        }

        $('.loader').removeClass('active'); 
        $('.stage').css('opacity',1);
        this.loading_icon = false;
    }

    // locks the view at index, views that are locked will not upate 
    // even if render is called (i.e. data_load event)
    lock(index) { 
        this.visible_views[index].lock();
    }

    // unlocks the view at the given index 
    unlock(index) { 
        this.visible_views[index].unlock(); 
    }
}