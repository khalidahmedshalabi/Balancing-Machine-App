function HexToRGBA(hex, alpha)
{
    hex = hex.replace('#','');
    return 'rgba('+parseInt(hex.substring(0,2), 16)+','+parseInt(hex.substring(2,4), 16)+','+parseInt(hex.substring(4,6), 16)+','+alpha+')';
}

var clicked_tab;

var current_color;

var orange = "#FF8B1B";
var yellow = "#DAA520";
var red = "#DE4E4E";
var pink = "#F76AD2";
var blue = "#198AB0";
var black = "#333333";
var green = "#3F996F";
var brown = "#755844"


$(".orange").css('background-color', orange);
$(".yellow").css('background-color', yellow);
$(".red").css('background-color', red);
$(".pink").css('background-color', pink);
$(".blue").css('background-color', blue);
$(".black").css('background-color', black);
$(".green").css('background-color', green);
$(".brown").css('background-color', brown);

function ChangeBodyColor(color, sound)
{
    if(color != current_color)
    {
        $("body").velocity({backgroundColor: color}, {queue: false, duration: 800});
        $(".ribbon").css('color', color);
        $(".tab").css('color', color);
        $(".tab").css('background-color', HexToRGBA(color, 0.1));
        $(".tab").css('border-color', color);
        current_color = color;
        if(clicked_tab)
            $(clicked_tab).trigger('click');
        $(".scroller").css('color', current_color);
        if(sound)
        {
            $("#audio_color_change")[0].currentTime = 0;
            $("#audio_color_change")[0].volume = 0.01;
            $("#audio_color_change")[0].play();
        }
    }
}

$(".orange").click(function(event) {
    ChangeBodyColor(orange, true);
});

$(".yellow").click(function(event) {
    ChangeBodyColor(yellow, true);
});

$(".red").click(function(event) {
    ChangeBodyColor(red, true);
});

$(".pink").click(function(event) {
    ChangeBodyColor(pink, true);
});

$(".blue").click(function(event) {
    ChangeBodyColor(blue, true);
});

$(".black").click(function(event) {
    ChangeBodyColor(black, true);
});

$(".green").click(function(event) {
    ChangeBodyColor(green, true);
});

$(".brown").click(function(event) {
    ChangeBodyColor(brown, true);
});

ChangeBodyColor(blue, false);

$(".customization_button").click(function(event) {
    $("#audio_button_click")[0].currentTime = 0;
    $("#audio_button_click")[0].volume = 0.05;
    $("#audio_button_click")[0].play();
});

$(".customization_button").hover(function() {
    $(this).css('color', current_color);
    $(this).find(".icon").css('border-color', current_color);

}, function() {
    $(this).css('color', 'currentColor');
    $(this).find(".icon").css('border-color', 'white');
});

$('.nav_tabs').on('mouseenter', '.tab', function() {
    if(this != clicked_tab)
        $(this).velocity("finish", true).velocity({backgroundColor: current_color, backgroundColorAlpha: 0.75, color: '#FFFFFF'}, {duration: 300, queue: false});
});

$('.nav_tabs').on('mouseleave', '.tab', function() {
    if(this != clicked_tab)
        $(this).velocity("finish", true).velocity({backgroundColorAlpha: 0.1, color: current_color}, {duration: 500, queue: false});
});

$('.nav_tabs').on('click', '.tab', function() {
    $(".tab").css('background-color', HexToRGBA(current_color, 0.1));
    $(".tab").css('color', current_color);
    clicked_tab = this;
    $("." + $(this).attr('class').split(' ')[1]).css('background-color', current_color);
    $("." + $(this).attr('class').split(' ')[1]).css('color', '#ffffff');
});

$(".message_box").hide();

$(".message_box_close").click(function(event) {
    $(".message_box").stop().hide();
});

function ShowMessageBox(type, message, duration) // type: 0 info, 1 warning, 2 error
{
    var icon;
    switch(type)
    {
        case 0:
        {
            icon = "<i class='fa fa-info-circle' style='font-size:250%;'></i><br><br>";
            break;
        }
        case 1:
        {
            icon = "<i class='fa fa-warning' style='font-size:250%;'></i><br><br>";
            break;
        }
        case 2:
        {
            icon = "<i class='fa fa-minus-circle' style='font-size:250%;'></i><br><br>";
            break;
        }
    }

    var msgbox = $(".message_box");

    msgbox.css('color', current_color);
    $(".message_box_body").empty();
    $(".message_box_body").append(icon + " " + message);
    $("#audio_msgbox")[0].currentTime = 0;
    $("#audio_msgbox")[0].volume = 0.9;
    $("#audio_msgbox")[0].play();
    msgbox.stop().fadeIn(500, function () {
        setTimeout(function () {
            msgbox.velocity({top: '-10%'}, {duration: 600, queue: false, complete: function () {
                msgbox.css('top', '5%');
            }});
            msgbox.fadeOut(500);
        }, (duration === undefined) ? 5000 : duration);
    });
}

var scroller_shown = false;

function ScrollTo(selector)
{
    $('html, body').animate({
        scrollTop: $(selector).offset().top
    }, 1000);
}

function CheckHideScroller()
{
    if(scroller_shown)
    {
        setTimeout(function () {
            if(scroller_shown && !$(".scroller").is(':hover'))
                $(".scroller").trigger('click');
        }, 3000);
    }
}

$(".scroller").click(function(event) {
    if(scroller_shown)
    {
        scroller_shown = false;
        $(".scroller_content").fadeOut(200, function() {
            $(".scroller_content").empty();
            $(".scroller_content").append('<i class="fa fa-arrows-v"></i>');
            $(".scroller_content").fadeIn(500);
        });
    }
    else
    {
        scroller_shown = true;
        $(".scroller_content").fadeOut(50, function() {
            $(".scroller_content").empty();
            $(".scroller_content").append('<ul class="scroller_list"><li onclick="ScrollTo(\'body\')">Top</li>' +
                '<li onclick="ScrollTo(\'.nav_tabs\')">Switch workspaces</li><li onclick="ScrollTo(\'.drawing\')">Balancing calculations</li>' +
                '<li onclick="ScrollTo(\'.section_graph\')">Vibration comparison</li>' +
                '<li onclick="ScrollTo(\'.section_export\')">Exporting</li>' +
                '<li onclick="ScrollTo(\'footer\')">Footer</li></ul>');
            $(".scroller_content").fadeIn(500);
            CheckHideScroller();
        });
    }
});

$(".scroller").hover(function() {
    // na
}, function() {
    CheckHideScroller();
});
