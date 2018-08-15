// The main javascript file that generates and runs a MERLIN session 
// global session variables 
let session = {},
    current_data = 0,
    current_view = 0;

// state program for managing state of app 
$(document).ready(() => {

    session = new Instance(); 
    // session.state = STATE.QUAD_APP
    // session.fetch_data(0);
    // for (let i = 1; i < 4; i++) {
    //     session.copy_data(i,0);  
    // }

    // session.fetch_data(0);
    // session.state = STATE.QUAD_APP;
    session.init_data();
    // session.load();

    $('#single-btn').click(function() { 
        if (session.state == STATE.SINGLE_APP) { 
            return; 
        }
        session.state = STATE.SINGLE_APP; 
        session.load(); 
    })

    $('#quad-btn').click(function() { 
        // alert('nooo');
        if (session.state == STATE.QUAD_APP) { 
            return;
        }
        session.state = STATE.QUAD_APP; 
        session.load(); 
    })
    

    $('.view-edit').click(function() {
        if ($(this).hasClass('active')) { 
            return; 
        }
        alert('nah');
        $('.view-edit.active').removeClass('active');
        $(this).addClass('active');
        session.selected_view = $(this).attr('data-value');
    })
    // $('.view-filter').change(function() { 
    //     // alert('oh');
    //     let val = $(this).val(); 
    //     let view = $(this).parent().parent();
    //     alert(view);
    // })
    $('.supdate').change(function(){
        session.fetch_data();
    });

    $('.time-filter-enter').change(function(){
        session.fetch_data();
    });

    $('#geo_btn').click(function(){ 
        let app = new Geo(); 
        session.load_app(app); 
    })

    $('#scatter_btn').click(function(){ 
        var x = prompt('x:',0);
        var y = prompt('y:',1);

        if (x == y) { 
            alert('x and y cannot be the same');
            return; 
        }
        let app = new ScatterPlot(x,y); 
        session.load_app(app); 
    })

    $('#pie_btn').click(function() { 
        let app = new Pie(0,1); 
        session.load_app(app);
    })

    $('#color_btn').click(function(){ 
        let view = session.visible_views[session.selected_view]; 
        if (view.app.color != null) { 
            if (view.app.color) { 
                view.app.color = false; 
                view.app.render();
            } else { 
                view.app.color = true; 
                view.app.render();
            }
            
        }
        
    })

    // let addedBiomes = new Set([]); 
    // let addedRegions = new Set([]); 

    $('#load_btn').click(function(){ 
        session.fetch_data(current_filter) 
    })

    $('.filter-btn').click(function() { 
        let index = $(this).attr('data-value');
        session.change_filter(index);
    })



    /*
	Dropdown with Multiple checkbox select with jQuery - May 27, 2013
	(c) 2013 @ElmahdiMahmoud
	license: https://www.opensource.org/licenses/mit-license.php
    */

    let drops = ['#biome-drop','#region-drop'];
    let texts = ['#biome-text','#region-text'];
    let sets = [addedBiomes,addedRegions];
    let name_sets = [addedBiomesNames,addedRegionsNames];

    $(".dropdown dt a").on('click', function() {
        let target = $(this).attr('data-target'); 
        // alert(target); 
        $(drops[target]).slideToggle('fast');
    });
    
    $(".dropdown dd ul li a").on('click', function() {
        $(drops[target]).hide();
    });
    
    $(document).bind('click', function(e) {
        var $clicked = $(e.target);
        if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
    });
    
    $('.mutliSelect input[type="checkbox"]').on('click', function() {

        var target = $(this).parent().parent().attr('data-target'); 
        let set = sets[target]; 
        let name_set = name_sets[target];
        let code = $(this).attr('data-code'); 
        // alert(target);
    
        var title = $(this).closest('.mutliSelect').find('input[type="checkbox"]').val(),
        title = $(this).val() + ",";
    
        if ($(this).is(':checked')) {
            var html = '<span title="' + title + '">' + title + '</span>';
            $('.multiSel.' + target).append(html);
            $(".hida." + target).hide();
            set.add(code); 
            name_set.add([html,code]);
            session.fetch_data();
        } else {
            $('span[title="' + title + '"]').remove();
            var ret = $(".hida." + target);
            $(texts[target]).append(ret);
            set.delete(code); 
            name_set.forEach(function(lit) { 
                if (lit[1] == code) {
                    name_set.delete(lit)
                }
            });
            session.fetch_data();
        }
    });


})

// on the resize of the window 
$(window).resize(() => { 
    session.refresh();
})
