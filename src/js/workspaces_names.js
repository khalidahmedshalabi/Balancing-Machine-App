var workspaces_names = new Array(MAX_TABS);

function InitializeWorkspaceNameing()
{
    /*
        [][0] = plane name
        [][1] = x axis name
        [][2] = y axis name
    */
    for(var i = 0, j = MAX_TABS; i < j; ++ i)
    {
    	workspaces_names[i] = new Array(3);
        workspaces_names[i][0] = "BP " + (i+1);
        workspaces_names[i][1] = "X";
        workspaces_names[i][2] = "Y";
	}
}

function UpdateWorkspaceNaming()
{
    CreateTabs(used_tabs);
}

InitializeWorkspaceNameing();
UpdateWorkspaceNaming();

function OnWorkspaceNameChange(obj, workspace_id, change_id)
{
    workspaces_names[workspace_id][change_id] = obj.value;
}

function ShowNamingConfigBox()
{
    $(".naming_config").hide();
    $(".naming_config").slideDown(700);
    $(".naming_config_container").fadeIn(800);

    // Build an updated table
    $(".naming_config_table").empty();

    var str = "<tr><th>Balance Plane NO.</th><th>Balance Plane Name</th><th>Axis #1</th><th>Axis #2</th></tr>";
    for(var i = 0; i < used_tabs; ++ i)
    {
        str += '<tr><td>' + (i+1) + '</td>';
        str += '<td><input type="text" class="input_workspace_name" onchange="OnWorkspaceNameChange(this, '+i+', 0)" value="' + workspaces_names[i][0] + '"></td>';
        str += '<td><input type="text" class="input_workspace_name" onchange="OnWorkspaceNameChange(this, '+i+', 1)" value="' + workspaces_names[i][1] + '"></td>';
        str += '<td><input type="text" class="input_workspace_name" onchange="OnWorkspaceNameChange(this, '+i+', 2)" value="' + workspaces_names[i][2] + '"></td>';
        str += '</tr>';
    }

    $(".naming_config_table").html(str);
}

function HideNamingConfigBox()
{
    $(".naming_config_container").fadeOut(500);
    UpdateWorkspaceNaming();
}
