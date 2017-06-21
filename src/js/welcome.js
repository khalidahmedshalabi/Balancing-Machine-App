function ShowWelcomeScreen()
{
    $(".welcome_screen").show();
    $("#body_wrapper").hide();
}

function HasUserVisitedBefore()
{
    if (typeof(Storage) !== "undefined")
    {
        if(localStorage.getItem("visitedbefore") != "1")
        {
            localStorage.setItem("visitedbefore", "1");
            ShowWelcomeScreen();
        }
    }
    else
    {
        if(firstImpression())
        {
            ShowWelcomeScreen();
        }
    }
}

HasUserVisitedBefore();

$(".welcome_button").click(function(event) {
    $('#body_wrapper').fadeIn(1500, function() {
        FixCanvasSize();
        DrawGraph();
    });
    $('.welcome_screen').css('min-height', '0');
    $('.welcome_screen').slideUp(700);
    window.scrollTo(0, 0);
});
