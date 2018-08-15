// The Instance class that manages all the apps and views in a given 
// session of Merlin
//
// Author - Jarod Boone

// state constants 
const STATE = Object.freeze({
    SINGLE_PLUME : 0, 
    SINGLE_APP : 1, 
    DUO_APP : 2, 
    TRI_APP : 3, 
    QUAD_APP : 4,  
})

// view constants for indexing and referencing views 
const VIEW = Object.freeze({ 
    ID : Object.freeze({
        MAIN_VIEW_ID : 'view0', 
        NUM_VIEW_ID : function (id) { 
            return 'view' + id; 
        },
    })
})

// constants for dealing with the filter 
const FILTER = Object.freeze({ 
    COLORS : [
        'rgb(26, 109, 204)',
        'rgb(26, 204, 204)',
        'rgb(154, 32, 202)',
        'rgb(127, 204, 26)'
    ], 
    SELECTION_ID : [
        ['#fb1','#fh1'],
        ['#fb2','#fh2'],
        ['#fb3','#fh3'],
        ['#fb4','#fh4']
    ],
    NAME : [
        'Filter 1', 
        'Filter 2', 
        'Filter 3', 
        'Filter 4',
    ]
})

// the sets regarding biomes and  
let addedBiomes = new Set([]); 
let addedRegions = new Set([]); 
let addedBiomesNames = new Set([]);
let addedRegionsNames = new Set([]);

// the sidebar that will be added to 
const SIDEBAR = document.getElementsByClassName('sidebar'); 

// get both sidebar types and hide them to start 
const GEO_HTML = $('#view-tab'); 
const DATA_HTML = $('#data-tab'); 

// make all sidebars invisible 
const SIDE_CLEAR = function () { 
    $('.sidebar-tool').each(function() {
        $(this).removeClass('active'); 
    });
}   

// make the geographic exploration sidebar visible 
const SIDE_GEO = function (instance) { 
    let tab = $('#geography-tab'); 
    // if we are already in a geographic state than we do nothing 
    if (instance.state == STATE.GEOGRAPHY) {
        console.assert(tab.hasClass('active')); 
        return; 
    }

    SIDE_CLEAR(); 
    tab.addClass('active'); 
}

// make the data exploration sidebar visible 
const SIDE_DATA = function (instance) { 
    let tab = $('#data-tab'); 
    // if we are already in a data state than we do nothing 
    // if we are not in geography state we are in a data state
    if (instance.state != STATE.GEOGRAPHY) {
        console.assert(tab.hasClass('active'));
        return; 
    }

    SIDE_CLEAR(); 
    tab.addClass('active'); 
}

// state to sidebar-render function map 
const SIDEBARS = [null,SIDE_GEO,SIDE_DATA,null,null,null]; 

// the instance class represents a session of MERLIN. This manages the 
// type of stage we are using as well as the sidebar controls for given 
// session type. Also data filters that have been saved are kept in a session 
// The general pattern for an instance is as follows
// 
//    - Create the Instance 
//    - Set the desired state 
//    - fetch data for each data index you will use 
// 
class Instance { 
    constructor() { 
        // the current state of the instance
        this.state = STATE.SINGLE_APP; 

        // the current view that is being edited by the instance 
        this.selected_view = 0; 

        // the current filter that is being edited by the instance 
        this.selected_filter = 0; 

        // the current views that have been loaded into this instance
        this.views = []; 

        // the current views that are visible in the current main viewport 
        this.visible_views = [null,null,null,null];

        // the data filters that are loaded into the instance 
        this.filters = [null,null,null,null]; 

        // loading functionality
        this.loading_icon = false; 
        this.load_count = 0;
    }

    // change the state of this instance to the given state
    change_state(state) { 
        this.state = state; 
        // SIDEBARS[this.state](this); 
        this.load(); // load the instance into the main viewport
    }

    // load this instance and render it this assumes that the state has already
    // been set appropriately. Loads into main viewport or "stage"
    load() { 
        const MAIN_VIEW_ID = 'view0'; 
        if (this.state == STATE.SINGLE_APP) { 
            $('.view').each(function () { 
                $(this).remove(); 
            })

            // append a single view 
            let view = $('<div></div>');  // generate the jquery view
            $('.stage').append(view); // attach the view to the stage 

            // initialize the view 
            view.attr('class','view')
                .attr('id',MAIN_VIEW_ID)
                .css('width','80vw')
                .css('height','93vh');

            // if (this.visible_views[this.selected_view]) { 
            //     this.visible_views[this.selected_view].attach(document.getElementById(MAIN_VIEW_ID));
            //     this.visible_views[this.selected_view].render(); 
            // } else { 
                // create a new view object, add a geographic app to it and render 
                this.visible_views[this.selected_view] = new View(document.getElementById(MAIN_VIEW_ID),this.selected_filter,0); 
                
                // set the current data to the selected view 
                let data = this.filters[this.selected_filter]; 
                this.visible_views[this.selected_view].load_data(data);

                // add an app to the selected view 
                let app = new Geo(); 
                this.visible_views[this.selected_view].load_app(app);

                // render the view 
                this.visible_views[this.selected_view].render(); 
            // }
        } else if (this.state == STATE.QUAD_APP) { 
            $('.view').each(function () { 
                $(this).remove(); 
            });

            // we want 4 views 
            for (let i = 0; i < 4; i++) { 

                // append the views
                let view = $('<div></div>');  // generate the jquery view
                let id = VIEW.ID.NUM_VIEW_ID(i); // generate a unique id for this view
                $('.stage').append(view); // attach the view to the stage 

                let right = !(i%2) ? '40vw' : '0px'; 
                let top = !(i < 2) ? '46.5vh' : '0px'; 

                // initialize the view 
                view.attr('class','view')
                    .attr('id',id)
                    .css('right',right)
                    .css('top',top)
                    .css('width','40vw')
                    .css('height','46.5vh');

                // if (this.visible_views[i]) { 
                //     this.visible_views[i].attach(document.getElementById(id));
                //     this.visible_views[i].render(); 
                // } else { 
                    // create a new view object, add a geographic app to it and render 
                    this.visible_views[i] = new View(document.getElementById(id),0,i); 
                    
                    // set the current data to the selected view 
                    // this.filters[i] = new Data(addedBiomes,addedRegions); 
                    // this.visible_views[i].load_data(this.filters[i]);

                    // add an app to the selected view 
                    let app = new Geo(); 
                    this.visible_views[i].load_app(app);

                    // render the view 
                    this.visible_views[i].render(); 
                // }

            }  
        }
    }

    init_data() { 
        let father_filter = new Data(addedBiomes,addedRegions,true);

        let self = this; 
        father_filter.dispatcher.addEventListener('data_load',function() {
            for (let i = 0; i < 4; i++) { 
                self.filters[i] = new Data(addedBiomes,addedRegions,false); 
                self.filters[i].content = father_filter.content.slice();
            }
            self.load();
        })
    }

    // change the instances current filter 
    change_filter(index) { 
        if (this.current_filter == index) { 
            return;
        }

        let old_ids = FILTER.SELECTION_ID[this.selected_filter];
        $(old_ids[0]).removeClass('active'); 
        $(old_ids[1]).removeClass('active'); 

        let new_ids = FILTER.SELECTION_ID[index]; 

        $(new_ids[0]).addClass('active'); 
        $(new_ids[1]).addClass('active'); 

        let color = FILTER.COLORS[index]; 

        $('#data-tab').css('border-color',color); 

        this.selected_filter = index; 

        this.filters[this.selected_filter].load();

    }

    // load data to the targeted data set 
    fetch_data() { 
        this.filters[this.selected_filter].update(addedBiomes,addedRegions); 
    }

    // copy data into another data set 
    copy_data(to,from) { 
        this.filters[to] = this.filters[from];
    }

    // switch the app on the selected view 
    load_app(app) { 
        this.visible_views[this.selected_view].load_app(app);
        this.visible_views[this.selected_view].render();  
    }

    // refresh the views of the instance
    refresh() { 
        console.log('refresh');
        this.visible_views.forEach(function (view) { 
            if (view) { 
                view.refresh(); 
            }
        });
    }

    // hide the views from the main viewport
    hide() { 
        this.visible_views.forEach(function (view) { 
            if (view) { 
                view.clean(); 
            }
        });
    }

    // increment the loading icon count
    show_loading_icon () { 
        this.load_count++;

        if (this.loading_icon) { 
            return;
        }

        $('.stage').css('opacity',0.5);
        $('.loader').addClass('active');
        $('.loader').css('opacity',1); 
        this.loading_icon = true;
    }

    // hide the loading icon
    hide_loading_icon() { 
        this.load_count--; 

        if (this.load_count != 0) { 
            return;
        }

        $('.loader').removeClass('active'); 
        $('.stage').css('opacity',1);
        this.loading_icon = false;
    }
}