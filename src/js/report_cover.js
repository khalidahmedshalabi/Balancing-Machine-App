function OnReportCoverSettingsUpdate(obj, setting)
{
    switch(setting)
    {
        case 0: // customer name
        {
            $(".report_custname").html(obj.value.toUpperCase());
            $(".summary:eq(0)").html($(".summary:eq(0)").html().replace(/"Customer Name"/gi, obj.value));
            $(".hidden_writing:eq(0)").html($(".hidden_writing:eq(0)").html().replace(/"Customer Name"/gi, obj.value));
            break;
        }
        case 1: // machine tag
        {
            $(".report_tag").html(obj.value);
            $(".summary:eq(0)").html($(".summary:eq(0)").html().replace(/"Machine Tag"/gi, obj.value));
            $(".hidden_writing:eq(0)").html($(".hidden_writing:eq(0)").html().replace(/"Machine Tag"/gi, obj.value));
            break;
        }
        case 2: // engineer name
        {
            $(".report_engname").html(obj.value);
            break;
        }
        case 3: // field
        {
            $(".report_field").html(obj.value);
            break;
        }
        case 4: // date
        {
            $(".report_date").html(obj.value);
            break;
        }
        case 5: // phone
        {
            $(".report_phone").html("M: " + obj.value);
            break;
        }
        case 6: // email
        {
            $(".report_email").html("E: " + obj.value);
            break;
        }
    }
}

function OnEditing(obj, id)
{
    $(".hidden_writing").eq(id).html(obj.value);
    autosize.update($(".hidden_writing").eq(id));
}
