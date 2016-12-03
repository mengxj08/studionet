$( document ).ready(function() {
    //console.log( "ready!" );

    $('.recent-activity-notifications').click( function(){
        alert("Shows recent activity list similar to Facebook");
    })

    $('.user-avatar').click( function(){
        alert("Shows basic user information on hover. User can navigate to full-user page from there.");
    })

    $('.zoom-extents').click( function(){
       //console.log("xoom");
       cy.reset();
    })

/*    $('.add-contribution').click( function(){
    	$('.add-contribution-dialog').show();
    })*/

    $('#cancel').click( function(){
    	$('.add-contribution-dialog').hide();
    })

    $('#cancel').click( function(){
        $('.add-contribution-dialog').hide();
    })


    $('#submit').click( function(){
    	$('.add-contribution-dialog').hide();
    })


    $('.side-nav-element').click( function(){

    		$('.side-nav-element').removeClass("active");
            $(this).addClass("active");

    })

    $('.sigma-scene').click( function(){
    	alert("graph clicked");
    })

    $("input[name='layout-radio']").on('change', function(){
        //alert("change layout!");
        refreshGraph();
        cy.reset();
    })


});

