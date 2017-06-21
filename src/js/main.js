(function($) {
        $.fn.extend({
            // Resize canvas as desired
            resizeCanvas:  function(w, h) {
                var c = $(this)[0]
                c.width = w;
                c.height = h
            }
        })
    })(jQuery)

autosize($('textarea'));

$(".input_date").val(new Date().toLocaleDateString());
$(".report_date").html($(".input_date").val());

$('.input_date').pickadate({
    format: 'm/d/yyyy',
    clear: 'Clear selection',
    close: 'Cancel'
});

function InitArray(arr, init_val)
{
	for(var i = 0, j = arr.length; i < j; i++)
    	arr[i] = init_val;
}

function MakeIt2DArray(arr, init_val)
{
	for(var i = 0, j = arr.length; i < j; i++)
    {
    	arr[i] = new Array(2);
        for(var k = 0; k < 2; k ++)
        {
        	arr[i][k] = init_val;
        }
	}
}

function Set2DArrayValues(arr, value1, value2)
{
    for(var i = 0, j = arr.length; i < j; i++)
    {
    	arr[i][0] = value1;
        arr[i][1] = value2;
	}
}

var
    MAX_TABS = 6, // 6 tabs, from 0 to 5
    used_tabs = 3, // currently used tabs
    is_tab_checked = new Array(MAX_TABS), // used for data in graph & table
    ctab = 0; // start with tab 0 (first tab)

// export report variables
var exporting_report= false, exporting_tab = 0;

MakeIt2DArray(is_tab_checked, true);

var draw_update_interval = 500;

function GetDrawPlane(axis)
{
    var tb = (exporting_report == true) ? exporting_tab : 0;
    if(axis == 0)
    {
        return $(".draw_x").eq(tb);
    }
    else if(axis == 1)
    {
        return $(".draw_y").eq(tb);
    }
    else
    {
        return $(".draw").eq(tb);
    }
}

function GetDrawPlaneAxis(axis)
{
    var tb = (exporting_report == true) ? exporting_tab : 0;
    if(axis == 0)
    {
        return $(".plane_x").eq(tb);
    }
    else if(axis == 1)
    {
        return $(".plane_y").eq(tb);
    }
}

function GetCenterX()
{
    return  $(".draw_x").width() * 0.5;
}

function GetCenterY()
{
    return  $(".draw_x").height() * 0.5;
}

function GetCircleRadiusDependent()
{
    return (($(".draw:first").innerHeight() > $(".draw:first").innerWidth()) ? $(".draw:first").innerWidth() : $(".draw:first").innerHeight() / 2);
}

function GetMainCircleRadius()
{
    return (GetCircleRadiusDependent() * 0.9);
}

var input_machine_type = new Array(MAX_TABS); // 0 slow ramping, 1 fast ramping
InitArray(input_machine_type, 0);

function OnMachineTypeSelected(obj)
{
    input_machine_type[ctab] = parseInt(obj.value);
    CalculateAdvisableCW();
}

var input_runningmode = new Array(MAX_TABS);
InitArray(input_runningmode, 0);

function OnRunningModeChange(obj)
{
    input_runningmode[ctab] = parseInt(obj.value);
    CalculateAdvisableCW();
}


var input_measurement_type = new Array(MAX_TABS); // 0 displacement, 1 velocity
InitArray(input_measurement_type, 0);

function OnMeasurementTypeSelected(obj)
{
    input_measurement_type[ctab] = parseInt(obj.value);
    if(input_measurement_type[ctab] == 0)
    {
        $(".velocity_unit").hide();
        $(".displacement_unit").show();
    }
    else
    {
        $(".displacement_unit").hide();
        $(".velocity_unit").show();
    }
    FixHVectorUnit();
    FixScaleAndSetPointUnit();
    FixScaleAndSetPointValues();
    BuildTable();
}

var input_unit = new Array(MAX_TABS); // 0 = mils or m/sec, 1 = microns or mm/sec
InitArray(input_unit, 0);
$(".velocity_unit").hide();

function OnUnitSelected(obj)
{
    input_unit[ctab] = parseInt(obj.value);
    FixHVectorUnit();
    FixScaleAndSetPointUnit();
    FixScaleAndSetPointValues();
    BuildTable();
}

var input_balanceweight = new Array(MAX_TABS); // 0 gram, 1 kg
InitArray(input_balanceweight, 0);

function OnBalanceWeightChange(obj)
{
    input_balanceweight[ctab] = parseInt(obj.value);
    CalculateVectorH(0);
    CalculateVectorH(1);
    CalculateAdvisableCW();
    if(input_balanceweight[ctab] == 0)
        $(".calib_weight_unit").html("gram");
    else if(input_balanceweight[ctab] == 1)
        $(".calib_weight_unit").html("kg");
}

function GetUnitAsStr(tab)
{
    if(input_measurement_type[tab] == 0)
    {
        return ($(".displacement_unit")[0].value == 0) ? "mils PP": "microns PP";
    }
    else
    {
        if($(".velocity_unit")[0].value == 0)
        {
            return "in/s RMS";
        }
        else if($(".velocity_unit")[0].value == 1)
        {
            return "mm/s RMS";
        }
        else if($(".velocity_unit")[0].value == 2)
        {
            return "in/s PK";
        }
        else if($(".velocity_unit")[0].value == 3)
        {
            return "mm/s PK";
        }
    }
}

function CalculateVectorH(axis)
{
    var plane = GetDrawPlaneAxis(axis);
    if(input_calib_weight[ctab][axis] > 0.0)
        H_length[ctab][axis] = C_length[ctab][axis].toFixed(2) / input_calib_weight[ctab][axis];
    else
        H_length[ctab][axis] = 0.0;

    if(input_balanceweight[ctab] == 0)
        H_length[ctab][axis] *= 1000.0;

    H_length[ctab][axis] = H_length[ctab][axis].toFixed(2);

    plane.find(".output_H_length").val(H_length[ctab][axis]);

    tmp = C_angle[ctab][axis] - calib_weight_angle[ctab][axis];
    while(tmp > 360.0)
        tmp -= 360.0;

    while(tmp < 0.0)
        tmp += 360.0;

    H_angle[ctab][axis] = tmp;

    plane.find(".output_H_angle").val(tmp.toFixed(2));
}

function CalculateCorrectionWeightMagnitude(axis)
{
    var plane = GetDrawPlaneAxis(axis);
    if(C_length[ctab][axis].toFixed(2) > 0.0)
        cw_magnitude[ctab][axis] = (O_length[ctab][axis] / C_length[ctab][axis].toFixed(2)) * input_calib_weight[ctab][axis];
    else
        cw_magnitude[ctab][axis] = 0.0;
    plane.find(".output_cw_magnitude").val(cw_magnitude[ctab][axis].toFixed(2));
}

function FixHVectorUnit()
{
    $(".vector_h_unit").html(GetUnitAsStr(ctab) + " per KG");
}

function FixScaleAndSetPointUnit()
{
    $(".setpoint_scale_unit").html(GetUnitAsStr(ctab));
}

function FixScaleAndSetPointValues()
{
    if(input_measurement_type[ctab] == 0) // displacment
    {
        if($(".displacement_unit")[0].value == 0) // mils
        {
            $(".input_scale").val(10.0);
            OnScaleChange($(".input_scale")[0], true);

            $(".input_alarm").val(4.0);
            OnAlarmChange($(".input_alarm")[0], true);

            $(".input_danger").val(7.0);
            OnDangerChange($(".input_danger")[0], true);

            $(".input_stepsize").val(2.0);
            OnStepSizeChange($(".input_stepsize")[0], true);

            $(".input_maxstep").val(7.0);
            OnMaxStepChange($(".input_maxstep")[0], true);
        }
        else // microns
        {
            $(".input_scale").val(250.0);
            OnScaleChange($(".input_scale")[0], true);

            $(".input_alarm").val(100.0);
            OnAlarmChange($(".input_alarm")[0], true);

            $(".input_danger").val(175.0);
            OnDangerChange($(".input_danger")[0], true);

            $(".input_stepsize").val(50.0);
            OnStepSizeChange($(".input_stepsize")[0], true);

            $(".input_maxstep").val(175.0);
            OnMaxStepChange($(".input_maxstep")[0], true);
        }
    }
    else // velocity
    {
        if($(".velocity_unit")[0].value == 0 || $(".velocity_unit")[0].value == 2) // in/s
        {
            $(".input_scale").val(2.0);
            OnScaleChange($(".input_scale")[0], true);

            $(".input_alarm").val(0.5);
            OnAlarmChange($(".input_alarm")[0], true);

            $(".input_danger").val(1.0);
            OnDangerChange($(".input_danger")[0], true);

            $(".input_stepsize").val(0.25);
            OnStepSizeChange($(".input_stepsize")[0], true);

            $(".input_maxstep").val(1.0);
            OnMaxStepChange($(".input_maxstep")[0], true);
        }
        else // mm/s
        {
            $(".input_scale").val(50.0);
            OnScaleChange($(".input_scale")[0], true);

            $(".input_alarm").val(12.5);
            OnAlarmChange($(".input_alarm")[0], true);

            $(".input_danger").val(25.0);
            OnDangerChange($(".input_danger")[0], true);

            $(".input_stepsize").val(6.25);
            OnStepSizeChange($(".input_stepsize")[0], true);

            $(".input_maxstep").val(25.0);
            OnMaxStepChange($(".input_maxstep")[0], true);
        }
    }
}

function AllowOnlyNumbers()
{
    return (event.ctrlKey || event.altKey
            || (47<event.keyCode && event.keyCode<58 && event.shiftKey==false)
            || (95<event.keyCode && event.keyCode<106)
            || (event.keyCode==8) || (event.keyCode==9)
            || (event.keyCode>34 && event.keyCode<40)
            || (event.keyCode==46));
}

var input_rotor_weight = new Array(MAX_TABS);
InitArray(input_rotor_weight, 100.0);

function OnRotorWeightChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Speed can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Speed can not be greater than 100");
                obj.value = 100;
            }*/
        }
        input_rotor_weight[ctab] = parseFloat(obj.value);
        CalculateAdvisableCW();
    }, draw_update_interval);
}

var input_bp_radius = new Array(MAX_TABS);
InitArray(input_bp_radius, 0.5);

function OnBPRadiusChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Balance plane radius can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Balance plane radius can not be greater than 100");
                obj.value = 100;
            }*/
        }
        input_bp_radius[ctab] = parseFloat(obj.value);
        CalculateAdvisableCW();
    }, draw_update_interval);
}

var input_scale = new Array(MAX_TABS);
InitArray(input_scale, 10.0);

function OnScaleChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Scale can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Scale can not be greater than 100");
                obj.value = 100;
            }*/
        }

        input_scale[ctab] = parseFloat(obj.value);
        ProcessDrawing(0);
        ProcessDrawing(1);
    }, draw_update_interval);
}

var input_speed = new Array(MAX_TABS);
InitArray(input_speed, 3000.0);

function OnSpeedChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Speed can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Speed can not be greater than 100");
                obj.value = 100;
            }*/
        }
        input_speed[ctab] = parseFloat(obj.value);
        CalculateAdvisableCW();
    }, draw_update_interval);
}

function CalculateGraphStepSize()
{
    if(input_alarm[ctab] > 0.0 && input_alarm[ctab] > input_stepsize)
    {
        input_stepsize = input_alarm[ctab] / 2;
        $(".input_stepsize").val(input_stepsize);
    }
}

function CalculateGraphMaxStep()
{
    if(input_danger[ctab] > 0.0 && input_danger[ctab] > input_maxstep)
    {
        input_maxstep = input_danger[ctab];
        $(".input_maxstep").val(input_maxstep);
    }
}

var input_alarm = new Array(MAX_TABS);
InitArray(input_alarm, 4.0);

function OnAlarmChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            input_alarm[ctab] = parseFloat(obj.value);
            CalculateGraphStepSize();
            DrawGraph();
        }
    }, draw_update_interval);
}

var input_danger = new Array(MAX_TABS);
InitArray(input_danger, 7.0);

function OnDangerChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            input_danger[ctab] = parseFloat(obj.value);
            CalculateGraphMaxStep();
            DrawGraph();
        }
    }, draw_update_interval);
}

var input_clockwise = new Array(MAX_TABS);
InitArray(input_clockwise, 0);
var clockwise = new Array(MAX_TABS);
InitArray(clockwise, false);

function OnDirectionChange(obj)
{
    setTimeout(function () {
        input_clockwise[ctab] = parseInt(obj.value);
        if(input_clockwise[ctab] == 0)
        {
            clockwise[ctab] = false;
        }
        else
        {
            clockwise[ctab] = true;
        }
        ProcessDrawing(0);
        ProcessDrawing(1);
    }, draw_update_interval);
}

var input_calib_weight = new Array(MAX_TABS);
MakeIt2DArray(input_calib_weight, 0.0);

function OnCalibWeightMChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "Calibration weight can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100.0)
        {
            ShowMessageBox(2, "Calibration weight can not be greater than 100");
            obj.value = 100;
        }*/
    }
    setTimeout(function () {
        input_calib_weight[ctab][axis] = parseFloat(obj.value);
        CalculateVectorH(axis);
        CalculateCorrectionWeightMagnitude(axis);
    }, draw_update_interval);
}

var calib_weight_angle = new Array(MAX_TABS);
MakeIt2DArray(calib_weight_angle, 0.0);

function OnCalibWeightAChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "Calibration weight angle can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "Calibration weight angle can not be greater than 100");
            obj.value = 100;
        }*/

        while(obj.value > 360.0)
        {
            obj.value -= 360.0;
        }
    }
    setTimeout(function () {
        calib_weight_angle[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
    }, draw_update_interval);
}

var O_length = new Array(MAX_TABS);
MakeIt2DArray(O_length, 0.0);

function OnOLengthChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "O length can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "O length can not be greater than 100");
            obj.value = 100;
        }*/
    }
    setTimeout(function () {
        O_length[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
        DrawGraph();
        BuildTable();
    }, draw_update_interval);
}

var O_angle = new Array(MAX_TABS);
MakeIt2DArray(O_angle, 0.0);

function OnOAngleChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "O angle can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "O angle can not be greater than 100");
            obj.value = 100;
        }*/
        while(obj.value > 360.0)
        {
            obj.value -= 360.0;
        }
    }
    setTimeout(function () {
        O_angle[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
        DrawGraph();
        BuildTable();
    }, draw_update_interval);
}

var OC_length = new Array(MAX_TABS);
MakeIt2DArray(OC_length, 0.0);

function OnOCLengthChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "O+C length can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "O+C length can not be greater than 100");
            obj.value = 100;
        }*/
    }
    setTimeout(function () {
        OC_length[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
        DrawGraph();
        BuildTable();
    }, draw_update_interval);
}

var OC_angle = new Array(MAX_TABS);
MakeIt2DArray(OC_angle, 0.0);

function OnOCAngleChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "O+C angle can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "O+C angle can not be greater than 100");
            obj.value = 100;
        }*/

        while(obj.value > 360.0)
        {
            obj.value -= 360.0;
        }
    }
    setTimeout(function () {
        OC_angle[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
        DrawGraph();
        BuildTable();
    }, draw_update_interval);
}

$(".input_done_button").click(function(event) {
    $('html, body').animate({
        scrollTop: $(".drawing").offset().top
    }, 1000);
});

$(".change_plane_settings").click(function(event) {
    $('html, body').animate({
        scrollTop: $(".plane_settings_container").offset().top
    }, {queue: false, duration: 1000, complete: function () {
        $(".plane_settings_container").velocity({backgroundColor:'#ffffff', backgroundColorAlpha:'0.2'}, {queue: false, duration:1000, complete: function() {
            setTimeout(function () {
                $(".plane_settings_container").velocity({backgroundColor:'#ffffff', backgroundColorAlpha:'0.0'}, {queue: false, duration:1000});
            }, 3000);
        }});
    }});
});

var sensor_angle_offset = new Array(MAX_TABS); // angle offset from NORTH
MakeIt2DArray(sensor_angle_offset, 45.0);

var sensor_direction = new Array(MAX_TABS); // 0 left, 1 right
MakeIt2DArray(sensor_direction, 0);
Set2DArrayValues(sensor_direction, 1, 0);

function OnSensorAngleChange(obj, axis, final)
{
    if(final)
    {
        if(obj.value < 0.0)
        {
            ShowMessageBox(2, "Sensor angle can not be less than zero");
            obj.value = 0.0;
        }
        /*else if(obj.value > 100)
        {
            ShowMessageBox(2, "Sensor angle can not be greater than 100");
            obj.value = 100;
        }*/

        while(obj.value > 360.0)
        {
            obj.value -= 360.0;
        }
    }
    setTimeout(function () {
        sensor_angle_offset[ctab][axis] = parseFloat(obj.value);
        ProcessDrawing(axis);
    }, draw_update_interval);
}

function OnSensorDirectionChange(obj, axis)
{
    setTimeout(function () {
        sensor_direction[ctab][axis] = parseInt(obj.value);
        ProcessDrawing(axis);
    }, draw_update_interval);
}

var input_stepsize = 2.0;

function OnStepSizeChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Scale can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Scale can not be greater than 100");
                obj.value = 100;
            }*/
        }

        input_stepsize = parseFloat(obj.value);
        DrawGraph();
    }, draw_update_interval);
}

var input_maxstep = 7.0;

function OnMaxStepChange(obj, final)
{
    setTimeout(function () {
        if(final)
        {
            /*if(obj.value < 10)
            {
                ShowMessageBox(2, "Scale can not be less than 10");
                obj.value = 10;
            }
            else if(obj.value > 100)
            {
                ShowMessageBox(2, "Scale can not be greater than 100");
                obj.value = 100;
            }*/
        }

        input_maxstep = parseFloat(obj.value);
        DrawGraph();
    }, draw_update_interval);
}

function CalculateAdvisableCW()
{
    var advisable_calib_weight = [0.0, 0.0, 0.0]; // magnitude, angle for X, angle for Y

    // Calculate magnitude
    advisable_calib_weight[0] = (input_rotor_weight[ctab] * 9.8) / (input_bp_radius[ctab] * Math.pow((2.0*(22.0/7.0)*input_speed[ctab]) / 60, 2.0));
    advisable_calib_weight[0] = (input_machine_type[ctab] == 0) ? (advisable_calib_weight[0] * 0.1) : (advisable_calib_weight[0] * 0.05);
    advisable_calib_weight[0] *= 1000.0;

    // Calculate angle for both X and Y
    switch(input_runningmode[ctab])
    {
        case 0:
        {
            advisable_calib_weight[1] = 180.0 + O_angle[ctab][0];
            advisable_calib_weight[2] = 180.0 + O_angle[ctab][1];
            break;
        }
        case 1:
        {
            advisable_calib_weight[1] = 90.0 + O_angle[ctab][0];
            advisable_calib_weight[2] = 90.0 + O_angle[ctab][1];
            break;
        }
        case 2:
        {
            advisable_calib_weight[1] = O_angle[ctab][0];
            advisable_calib_weight[2] = O_angle[ctab][1];
            break;
        }
    }

    // increase by 90 deg if measurement type is velocity
    if(input_measurement_type[ctab] == 1)
    {
        advisable_calib_weight[1] += 90.0;
        advisable_calib_weight[2] += 90.0;
    }
    while(advisable_calib_weight[1] > 360.0)
        advisable_calib_weight[1] -= 360.0;
    while(advisable_calib_weight[2] > 360.0)
        advisable_calib_weight[2] -= 360.0;

    $(".plane_x").find(".advisable_calib_weight").html("<i class='fa fa-warning'></i> Calibration weight should be " + advisable_calib_weight[0].toFixed(2) + " (gram) @ " + advisable_calib_weight[1].toFixed(2) + " (deg)");
    $(".plane_y").find(".advisable_calib_weight").html("<i class='fa fa-warning'></i> Calibration weight should be " + advisable_calib_weight[0].toFixed(2) + " (gram) @ " + advisable_calib_weight[2].toFixed(2) + " (deg)");
}

CalculateAdvisableCW();

function toRadians(angle)
{
	return angle * (Math.PI/180.0);
}

function toDegrees(angle)
{
	return angle * (180.0/Math.PI);
}

function GetAngleAfterOffset(angle, axis)
{
    var ret_angle_offset;
    if(sensor_direction[ctab][axis] == 1)
    {
        ret_angle_offset = (angle);
    }
    else
    {
        ret_angle_offset = -(angle);
    }
    return ret_angle_offset;
}

function GetAngleDirection(angle, axis)
{
    var tmp = angle;
    if(clockwise[ctab])
    {
        if(sensor_direction[ctab][axis] == 1)
        {
            tmp = sensor_angle_offset[ctab][axis] + angle;
        }
        else
        {
            tmp = sensor_angle_offset[ctab][axis] - angle;
        }
    }
    else
    {
        if(sensor_direction[ctab][axis] == 1)
        {
            tmp = sensor_angle_offset[ctab][axis] - angle;
        }
        else
        {
            tmp = sensor_angle_offset[ctab][axis] + angle;
        }
    }
    return tmp;
}

function DrawDegreesAroundCircle(axis)
{
	var radius = GetMainCircleRadius() + (GetCircleRadiusDependent() * 0.06);
	var i, current_angle;
    var angle_offset = GetAngleAfterOffset(sensor_angle_offset[ctab][axis], axis);

    var draw = GetDrawPlane(axis);

    switch(clockwise[ctab])
    {
        case true:
        {
            for(i = 0; i <= 350; i += 10)
        	{
                current_angle = i + 270 + angle_offset;

                // Draw degree number
        		draw.drawText({
                    layer: true,
                    fillStyle: '#000000',
                    strokeWidth: 3,
                    x: GetCenterX() + (radius * Math.cos(toRadians(current_angle))),
                    y: GetCenterY() + (radius * Math.sin(toRadians(current_angle))),
                    fontSize: '12pt',
                    fontFamily: 'arial',
                    text: i,
                    scale: 0.7
        		});

                // Draw grid line to that degree
                draw.drawLine({
                    layer: true,
                    strokeStyle: '#CCCCCC',
                    strokeWidth: 1,
                    x1: GetCenterX(),
                    y1: GetCenterY(),
                    x2: GetCenterX() + (GetMainCircleRadius() * Math.cos(toRadians(current_angle))),
                    y2: GetCenterY() + (GetMainCircleRadius() * Math.sin(toRadians(current_angle)))
                });
        	}
            break;
        }
        case false:
        {
            var degree_number = 0;
            for(i = 360; i >= 10; i -= 10)
        	{
                current_angle = i + 270 + angle_offset;

                // Draw degree number
        		draw.drawText({
                    layer: true,
                    fillStyle: '#000000',
                    strokeWidth: 3,
                    x: GetCenterX() + (radius * Math.cos(toRadians(current_angle))),
                    y: GetCenterY() + (radius * Math.sin(toRadians(current_angle))),
                    fontSize: '12pt',
                    fontFamily: 'arial',
                    text: degree_number,
                    scale: 0.7
        		});
                degree_number += 10;

                // Draw grid line to that degree
                draw.drawLine({
                    layer: true,
                    strokeStyle: '#CCCCCC',
                    strokeWidth: 1,
                    x1: GetCenterX(),
                    y1: GetCenterY(),
                    x2: GetCenterX() + (GetMainCircleRadius() * Math.cos(toRadians(current_angle))),
                    y2: GetCenterY() + (GetMainCircleRadius() * Math.sin(toRadians(current_angle)))
                });
        	}
            break;
        }
    }

    // Draw grid circles inside the main circle
    var num_of_grid_circles = 10;
    var scale_diff = input_scale[ctab] / num_of_grid_circles;
    var scaled_scale_diff = (scale_diff * GetMainCircleRadius()) / input_scale[ctab];

    var scale_numbers_angle = 0;
    var tmp_avg_ang = OC_angle[ctab][axis] + O_angle[ctab][axis];
    while(tmp_avg_ang > 360)
    {
        tmp_avg_ang -= 360;
    }

    if(tmp_avg_ang == 360 || tmp_avg_ang == 0)
    {
        scale_numbers_angle = 450 + GetAngleAfterOffset(sensor_angle_offset[ctab][axis], axis);
    }
    else
    {
        scale_numbers_angle = GetAngleAfterOffset(GetAngleDirection((tmp_avg_ang / 2) + 180, axis), axis) + 270;
    }

    var curr_scaled_scale = scaled_scale_diff, curr_scale = scale_diff;

    while(curr_scale < input_scale[ctab])
    {
        draw.drawArc({
            layer: true,
    		strokeStyle: '#CCCCCC',
    		strokeWidth: 1,
    		x: GetCenterX(),
    		y: GetCenterY(),
    		radius: curr_scaled_scale
    	});

        // Draw scale number
        draw.drawText({
            layer: true,
            fillStyle: '#666666',
            strokeWidth: 3,
            x: GetCenterX() + (curr_scaled_scale * Math.cos(toRadians(scale_numbers_angle))),
            y: GetCenterY() + (curr_scaled_scale * Math.sin(toRadians(scale_numbers_angle))),
            fontSize: '12pt',
            fontFamily: 'arial',
            text: (Number.isInteger(curr_scale)) ? curr_scale : curr_scale.toFixed(1),
            scale: 0.8
        });

        curr_scaled_scale += scaled_scale_diff;
        curr_scale += scale_diff;
    }
}

var C_angle = new Array(MAX_TABS), C_length = new Array(MAX_TABS);
var H_angle = new Array(MAX_TABS), H_length = new Array(MAX_TABS);
var cw_magnitude = new Array(MAX_TABS), cw_angle = new Array(MAX_TABS);
MakeIt2DArray(C_angle, 0.0);
MakeIt2DArray(C_length, 0.0);
MakeIt2DArray(cw_magnitude, 0.0);
MakeIt2DArray(cw_angle, 0.0);
MakeIt2DArray(H_angle, 0.0);
MakeIt2DArray(H_length, 0.0);

function ProcessDrawing(axis, given_OC_length, given_OC_angle)
{
    var draw = GetDrawPlane(axis);
    var plane = GetDrawPlaneAxis(axis);

    // Clear before drawing
    draw.removeLayers();
    draw.clearCanvas();

	DrawDegreesAroundCircle(axis);

    // Draw a full circle
	draw.drawArc({
        layer: true,
		strokeStyle: '#000',
		strokeWidth: 2,
        fillStyle: 'rgba(0, 0, 0, 0.008)',
		x: GetCenterX(),
		y: GetCenterY(),
		radius: GetMainCircleRadius(),
        click: function(layer) {
            var click_calc_OC_len, click_calc_OC_angle;

            click_calc_OC_len = Math.sqrt(Math.pow(GetCenterX() - layer.eventX, 2) + Math.pow(GetCenterY() - layer.eventY, 2));
            click_calc_OC_angle = toDegrees(Math.atan2(layer.eventY - GetCenterY(), layer.eventX - GetCenterX()));

            ProcessDrawing(axis, click_calc_OC_len, click_calc_OC_angle+90);
        }
	});

    // Draw an arc that indicates whether we're going clockwise or counter-clockwise
	draw.drawArc({
        layer: true,
		strokeStyle: '#666666',
		strokeWidth: 5,
        startArrow: (clockwise[ctab]) ? true : false,
        endArrow: (clockwise[ctab]) ? false : true,
		arrowRadius: 15,
		arrowAngle: 90,
		x: GetCircleRadiusDependent() * 0.15,
		y: GetCircleRadiusDependent() * 0.15,
		radius: GetCircleRadiusDependent() * 0.1,
        start: 30, end: 330,
        rounded: true
	});

    // Vector O
    var O_length_scaled = O_length[ctab][axis] * (GetMainCircleRadius() / input_scale[ctab]);
	draw.drawVector({
        layer: true,
		strokeStyle: 'red',
		strokeWidth: 2,
		endArrow: true,
		arrowRadius: 9,
		arrowAngle: 90,
		a1: GetAngleAfterOffset(GetAngleDirection(O_angle[ctab][axis], axis), axis),
        l1: O_length_scaled,
		x: GetCenterX(),
		y: GetCenterY()
	});

    // Vector OC
    var OC_length_scaled;
    if(given_OC_length === undefined)
        OC_length_scaled = OC_length[ctab][axis] * (GetMainCircleRadius() / input_scale[ctab]);
    else
    {
        OC_length_scaled = given_OC_length;
        OC_length[ctab][axis] = OC_length_scaled / (GetMainCircleRadius() / input_scale[ctab]);
        plane.find(".input_OC_length").val(OC_length[ctab][axis].toFixed(2));
    }

    var OC_angle_scaled;
    if(given_OC_angle === undefined)
    {
        OC_angle_scaled = GetAngleAfterOffset(GetAngleDirection(OC_angle[ctab][axis], axis), axis);
    }
    else
    {
        OC_angle_scaled = given_OC_angle;

        if(clockwise[ctab])
        {
            OC_angle[ctab][axis] = OC_angle_scaled;
            if(sensor_direction[ctab][axis] == 0)
            {
                OC_angle[ctab][axis] += sensor_angle_offset[ctab][axis];
            }
            else
            {
                OC_angle[ctab][axis] -= sensor_angle_offset[ctab][axis];
            }
        }
        else
        {
            OC_angle[ctab][axis] = -OC_angle_scaled;
            if(sensor_direction[ctab][axis] == 0)
            {
                OC_angle[ctab][axis] -= sensor_angle_offset[ctab][axis];
            }
            else
            {
                OC_angle[ctab][axis] += sensor_angle_offset[ctab][axis];
            }
        }

        while(OC_angle[ctab][axis] < 0.0)
            OC_angle[ctab][axis] += 360.0;

        while(OC_angle[ctab][axis] > 360.0)
            OC_angle[ctab][axis] -= 360.0;

        plane.find(".input_OC_angle").val(OC_angle[ctab][axis].toFixed(2));
    }

	draw.drawVector({
        layer: true,
		strokeStyle: 'blue',
		strokeWidth: 2,
		endArrow: true,
		arrowRadius: 9,
		arrowAngle: 90,
		a1: OC_angle_scaled,
        l1: OC_length_scaled,
		x: GetCenterX(),
		y: GetCenterY()
	});

    // Calculate vector C's direction and mangitude and then draw it
    var head_of_vector_O = [0.0, 0.0];
    head_of_vector_O[0] = GetCenterX() + (O_length_scaled * Math.cos(toRadians(GetAngleAfterOffset(GetAngleDirection(O_angle[ctab][axis], axis), axis)-90)));
    head_of_vector_O[1] = GetCenterY() + (O_length_scaled * Math.sin(toRadians(GetAngleAfterOffset(GetAngleDirection(O_angle[ctab][axis], axis), axis)-90)));

    var head_of_vector_OC = [0.0, 0.0];
    head_of_vector_OC[0] = GetCenterX() + (OC_length_scaled * Math.cos(toRadians(GetAngleAfterOffset(GetAngleDirection(OC_angle[ctab][axis], axis), axis)-90)));
    head_of_vector_OC[1] = GetCenterY() + (OC_length_scaled * Math.sin(toRadians(GetAngleAfterOffset(GetAngleDirection(OC_angle[ctab][axis], axis), axis)-90)));

    var C_length_scaled = Math.sqrt(Math.pow(head_of_vector_OC[0] - head_of_vector_O[0], 2) + Math.pow(head_of_vector_OC[1] - head_of_vector_O[1], 2));

    C_angle[ctab][axis] = toDegrees(Math.acos((Math.pow(O_length_scaled, 2) + Math.pow(C_length_scaled, 2) - Math.pow(OC_length_scaled, 2)) / (2*O_length_scaled*C_length_scaled)));

    C_length[ctab][axis] = C_length_scaled / (GetMainCircleRadius() / input_scale[ctab]);
    plane.find(".output_C_length").val(C_length[ctab][axis].toFixed(2));

    var O_OC_angle_diff = Math.abs(O_angle[ctab][axis] - OC_angle[ctab][axis]);
    if(O_OC_angle_diff <= 180.0)
    {
        if(O_angle[ctab][axis] > OC_angle[ctab][axis])
        {
            C_angle[ctab][axis] = GetAngleAfterOffset(GetAngleDirection(180 - (180 - ((180 + C_angle[ctab][axis]) + O_angle[ctab][axis])), axis), axis);
        }
        else
        {
            C_angle[ctab][axis] = GetAngleAfterOffset(GetAngleDirection(180 - (180 - ((180 - C_angle[ctab][axis]) + O_angle[ctab][axis])), axis), axis);
        }
    }
    else
    {
        if(O_angle[ctab][axis] > OC_angle[ctab][axis])
        {
            C_angle[ctab][axis] = GetAngleAfterOffset(GetAngleDirection(180 - (180 - ((180 - C_angle[ctab][axis]) + O_angle[ctab][axis])), axis), axis);
        }
        else
        {
            C_angle[ctab][axis] = GetAngleAfterOffset(GetAngleDirection(180 - (180 - ((180 + C_angle[ctab][axis]) + O_angle[ctab][axis])), axis), axis);
        }
    }

    var C_draw_angle = C_angle[ctab][axis];

    var tmp = Math.abs(C_angle[ctab][axis]);
    if(clockwise[ctab])
    {
        if(sensor_direction[ctab][axis] == 0)
        {
            tmp += sensor_angle_offset[ctab][axis];
        }
        else
        {
            tmp -= sensor_angle_offset[ctab][axis];
        }
    }
    else
    {
        if(sensor_direction[ctab][axis] == 0)
        {
            tmp -= sensor_angle_offset[ctab][axis];
        }
        else
        {
            tmp += sensor_angle_offset[ctab][axis];
        }
    }

    while(tmp > 360.0)
        tmp -= 360.0;

    plane.find(".output_C_angle").val(tmp.toFixed(2));

    C_angle[ctab][axis] = tmp;

    draw.drawVector({
        layer: true,
		strokeStyle: 'green',
		strokeWidth: 2,
		endArrow: true,
		arrowRadius: 9,
		arrowAngle: 90,
        a1: C_draw_angle,
        l1: C_length_scaled,
		x: head_of_vector_O[0],
		y: head_of_vector_O[1]
	});

	// Draw calibration weight
	draw.drawArc({
        layer: true,
		fillStyle: '#555555',
		x: GetCenterX() + (GetMainCircleRadius() * Math.cos(toRadians(GetAngleAfterOffset(GetAngleDirection(calib_weight_angle[ctab][axis], axis), axis) - 90))),
		y: GetCenterY() + (GetMainCircleRadius() * Math.sin(toRadians(GetAngleAfterOffset(GetAngleDirection(calib_weight_angle[ctab][axis], axis), axis) - 90))),
		radius: (GetCircleRadiusDependent() * 0.06) / 1.5
	});

    // Calculate correction weight and then draw it
    CalculateCorrectionWeightMagnitude(axis);

    tmp = O_angle[ctab][axis];
    tmp = 180.0 + tmp;
    while(tmp > 360.0)
        tmp -= 360.0;

    cw_angle[ctab][axis] = (tmp) - C_angle[ctab][axis] + calib_weight_angle[ctab][axis];

    tmp = Math.abs(cw_angle[ctab][axis]);
    while(tmp > 360.0)
        tmp -= 360.0;

    plane.find(".output_cw_angle").val(tmp.toFixed(2));

    draw.drawArc({
        layer: true,
		fillStyle: '#E66000',
		x: GetCenterX() + (GetMainCircleRadius() * Math.cos(toRadians(GetAngleAfterOffset(GetAngleDirection(cw_angle[ctab][axis], axis), axis) - 90))),
		y: GetCenterY() + (GetMainCircleRadius() * Math.sin(toRadians(GetAngleAfterOffset(GetAngleDirection(cw_angle[ctab][axis], axis), axis) - 90))),
		radius: (GetCircleRadiusDependent() * 0.06) / 1.5
	});

    // Calculate vector H (influence vector)
    CalculateVectorH(axis);

    FixHVectorUnit();
    FixScaleAndSetPointUnit();
    CalculateAdvisableCW();
}

var chart = new Chart($(".graph"));

function DrawGraph()
{
    var draw = $(".graph");

    // Clear before drawing
    draw.clearCanvas();
    draw.removeLayers();
    chart.destroy();

    var
        labels = new Array(),
        values = new Array(),
        bgcol = new Array(),
        bordercol = new Array(),
        gridLinesColArr = new Array(),
        max_alarm = 0, max_danger = 0,
        bars_shown = 0;

    var AddEmptyDataToChart = function ()
    {
        if(bars_shown < 4 * MAX_TABS)
        {
            var i;
            var data_count_on_each = Math.ceil(((4 * MAX_TABS) - bars_shown) / 2);

            // Add at the beginning and at the end
            for(i = 0; i < data_count_on_each; i ++)
            {
                // Beginning
                labels.push(" ");
                values.push(0);
                bgcol.push("rgba(0, 0, 0, 0.0)");
                bordercol.push("rgba(0, 0, 0, 0.0)");

                // End
                labels.unshift(" ");
                values.unshift(0);
                bgcol.unshift("rgba(0, 0, 0, 0.0)");
                bordercol.unshift("rgba(0, 0, 0, 0.0)");
            }
        }
    };

    for(var i = 0; i < used_tabs; i ++)
    {
        if(parseFloat(input_alarm[i]) > max_alarm)
            max_alarm = parseFloat(input_alarm[i]);

        if(parseFloat(input_danger[i]) > max_danger)
            max_danger = parseFloat(input_danger[i]);

        if(is_tab_checked[i][0] == true && is_tab_checked[i][1] == true) // X and Y
        {
            bars_shown += 4;

            if(i != 0)
                labels.push(" "); // spacing
            labels.push(workspaces_names[i][0] + "_" + workspaces_names[i][1]);
            labels.push(" ");
            labels.push(" "); // spacing
            labels.push(workspaces_names[i][0] + "_" + workspaces_names[i][2]);
            labels.push(" ");

            if(i != 0)
                values.push(0); // spacing
            values.push(O_length[i][0]);
            values.push(OC_length[i][0]);
            values.push(0); // spacing
            values.push(O_length[i][1]);
            values.push(OC_length[i][1]);

            if(i != 0)
                bgcol.push("rgba(0, 0, 0, 0.0)"); // spacing
            bgcol.push("rgba(232, 28, 28, 0.8)");
            bgcol.push("rgba(28, 31, 232, 0.8)");
            bgcol.push("rgba(0, 0, 0, 0.0)"); // spacing
            bgcol.push("rgba(232, 28, 28, 0.8)");
            bgcol.push("rgba(28, 31, 232, 0.8)");

            if(i != 0)
                bordercol.push("rgba(0, 0, 0, 0.0)"); // spacing

            bordercol.push("rgba(232, 28, 28, 0.9)");
            bordercol.push("rgba(28, 31, 232, 0.9)");
            bordercol.push("rgba(0, 0, 0, 0.0)"); // spacing
            bordercol.push("rgba(232, 28, 28, 0.9)");
            bordercol.push("rgba(28, 31, 232, 0.9)");
        }
        else if(is_tab_checked[i][0] == true && is_tab_checked[i][1] == false) // X only
        {
            bars_shown += 2;

            if(i != 0)
                labels.push(" "); // spacing
            labels.push(workspaces_names[i][0] + "_" + workspaces_names[i][1]);
            labels.push(" ");

            if(i != 0)
                values.push(0); // spacing
            values.push(O_length[i][0]);
            values.push(OC_length[i][0]);

            if(i != 0)
                bgcol.push("rgba(0, 0, 0, 0.0)"); // spacing
            bgcol.push("rgba(232, 28, 28, 0.8)");
            bgcol.push("rgba(28, 31, 232, 0.8)");

            if(i != 0)
                bordercol.push("rgba(0, 0, 0, 0.0)"); // spacing

            bordercol.push("rgba(232, 28, 28, 0.9)");
            bordercol.push("rgba(28, 31, 232, 0.9)");
        }
        else if(is_tab_checked[i][0] == false && is_tab_checked[i][1] == true) // Y only
        {
            bars_shown += 2;

            if(i != 0)
                labels.push(" "); // spacing
            labels.push(workspaces_names[i][0] + "_" + workspaces_names[i][2]);
            labels.push(" ");

            if(i != 0)
                values.push(0); // spacing
            values.push(O_length[i][1]);
            values.push(OC_length[i][1]);

            if(i != 0)
                bgcol.push("rgba(0, 0, 0, 0.0)"); // spacing
            bgcol.push("rgba(232, 28, 28, 0.8)");
            bgcol.push("rgba(28, 31, 232, 0.8)");

            if(i != 0)
                bordercol.push("rgba(0, 0, 0, 0.0)"); // spacing

            bordercol.push("rgba(232, 28, 28, 0.9)");
            bordercol.push("rgba(28, 31, 232, 0.9)");
        }
        /*else if(is_tab_checked[i][0] == false && is_tab_checked[i][1] == false) // none
        {

        }*/
    }

    AddEmptyDataToChart();

    chart = new Chart(draw, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amplitude',
                data: values,
                backgroundColor: bgcol,
                borderColor: bordercol,
                borderWidth: 0,
                hoverBorderWidth: 0
            }]
        },
        options: {
            animation: false,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: '#000000',
                        fontSize: 12,
                        beginAtZero: true,
                        fixedStepSize: input_stepsize,
                        max: input_maxstep,
                        min: 0.0,
                        callback: function(value, index, values) {
                            if(index == 0)
                            {
                                gridLinesColArr.length = values.length;
                                for(var i = 0; i < values.length; ++ i)
                                {
                                    if(values[i] == max_danger)
                                    {
                                        gridLinesColArr[i] = "red";
                                    }
                                    else if(values[i] == max_alarm)
                                    {
                                        gridLinesColArr[i] = "yellow";
                                    }
                                    else
                                    {
                                        gridLinesColArr[i] = "rgba(0, 0, 0, 0.2)";
                                    }
                                }
                            }

                            if(value == max_danger)
                            {
                                return "Danger = " + ((value % 1 === 0) ? value : value.toFixed(2));
                            }
                            else if(value == max_alarm)
                            {
                                return "Alarm = " + ((value % 1 === 0) ? value : value.toFixed(2));
                            }
                            else
                            {
                                return ((value % 1 === 0) ? value : value.toFixed(2));
                            }
                        }
                    },
                    gridLines: {
                        color: gridLinesColArr,
                        zeroLineColor: 'black',
                        zeroLineWidth: 3,
                        drawTicks: false,
                        lineWidth: 1,
                        drawBorder: false
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontColor: '#000000',
                        fontSize: 13
                    },
                    gridLines: {
                        color: 'rgba(0, 0, 0, 0.0)',
                        zeroLineColor: 'black',
                        zeroLineWidth: 3
                    },
                    categoryPercentage: 1.0,
                    barPercentage: 1.0
                }]
            }
        }
    });
}

function BuildTable()
{
    $(".graph_table").empty();

    var bearings_row = "<tr><th rowspan='2' style='width: 10%;'>Unit: " + GetUnitAsStr(0)  + "</th>";
    var O_row = "<tr><th>Before</th>";
    var OC_row = "<tr><th>After</th>";
    var XY_row = "";

    for(var i = 0; i < used_tabs; i ++)
    {
        if(is_tab_checked[i][0] == true && is_tab_checked[i][1] == true) // X and Y
        {
            bearings_row += "<th colspan='2'>" + workspaces_names[i][0] + "</th>";
            XY_row += "<td>" + workspaces_names[i][1] + "</td><td>" + workspaces_names[i][2] + "</td>";
            O_row += "<td>" + O_length[i][0] + "</td><td>" + O_length[i][1] + "</td>";
            OC_row += "<td>" + OC_length[i][0] + "</td><td>" + OC_length[i][1] + "</td>";
        }
        else if(is_tab_checked[i][0] == true && is_tab_checked[i][1] == false) // X only
        {
            bearings_row += "<th colspan='1'>" + workspaces_names[i][0] + "</th>";
            XY_row += "<td>" + workspaces_names[i][1] + "</td>";
            O_row += "<td>" + O_length[i][0] + "</td>";
            OC_row += "<td>" + OC_length[i][0] + "</td>";
        }
        else if(is_tab_checked[i][0] == false && is_tab_checked[i][1] == true) // Y only
        {
            bearings_row += "<th colspan='1'>" + workspaces_names[i][0] + "</th>";
            XY_row += "<td>" + workspaces_names[i][2] + "</td>";
            O_row += "<td>" + O_length[i][1] + "</td>";
            OC_row += "<td>" + OC_length[i][1] + "</td>";
        }
    }
    $(".graph_table").append(bearings_row + "</tr>");
    $(".graph_table").append("<tr>" + XY_row + "</tr>");
    $(".graph_table").append(O_row + "</tr>");
    $(".graph_table").append(OC_row + "</tr>");
}

function ChangeBearingCheckboxStatus(tab, axis)
{
    is_tab_checked[tab][axis] = !is_tab_checked[tab][axis];
    BuildTable();
    DrawGraph();
}

function CreateBearingCheckbox()
{
    $(".table_graph_checkboxes_container").empty();

    var str = "", tmp = "";

    for(var i = 0; i < used_tabs; ++ i)
    {
        str += '<div class="table_graph_single_checkbox"><span>' + workspaces_names[i][0] + '</span><br><br>';
        tmp = (is_tab_checked[i][0] == true) ? (' checked') : ('');
        str += '<input type="checkbox"' + tmp +' onclick="ChangeBearingCheckboxStatus(' + i + ', 0)">';
        str += workspaces_names[i][1];
        tmp = (is_tab_checked[i][1] == true) ? (' checked') : ('');
        str += '<input type="checkbox"' + tmp +' onclick="ChangeBearingCheckboxStatus(' + i + ', 1)">';
        str += workspaces_names[i][2] + '</div>';
    }

    $(".table_graph_checkboxes_container").append(str);

    if(used_tabs > 3)
    {
        $(".table_graph_single_checkbox").width(parseFloat(100/3) + "%");
    }
    else
    {
        $(".table_graph_single_checkbox").width(parseFloat(100/used_tabs) + "%");
    }
}

function SwitchTab(newtab)
{
    ctab = newtab;

    $(".section_input:first, .drawing:first").find(".bearing_title").html(workspaces_names[ctab][0]);
    $(".plane_x:first").find(".plane_axis_title").html(workspaces_names[ctab][1]);
    $(".plane_y:first").find(".plane_axis_title").html(workspaces_names[ctab][2]);

    $(".input_machine_type:first").val(input_machine_type[ctab]);
    $(".input_runningmode:first").val(input_runningmode[ctab]);
    $(".input_rotor_weight:first").val(input_rotor_weight[ctab]);
    $(".input_bp_radius:first").val(input_bp_radius[ctab]);
    $(".input_speed:first").val(input_speed[ctab]);
    $(".input_measurement_type:first").val(input_measurement_type[ctab]);
    $(".input_unit:first").val(input_unit[ctab]);
    $(".input_scale:first").val(input_scale[ctab]);
    $(".input_clockwise:first").val(input_clockwise[ctab]);
    $(".input_balanceweight:first").val(input_balanceweight[ctab]);
    $(".input_alarm:first").val(input_alarm[ctab]);
    $(".input_danger:first").val(input_danger[ctab]);

    for(var i = 0; i < 2; i ++)
    {
        var plane = (i == 0) ? $(".plane_x:first") : $(".plane_y:first");

        plane.find(".input_sensor_angle_offset:first").val(sensor_angle_offset[ctab][i]);
        plane.find(".input_sensor_direction:first").val(sensor_direction[ctab][i]);
        plane.find(".input_O_length:first").val(O_length[ctab][i]);
        plane.find(".input_O_angle:first").val(O_angle[ctab][i]);
        plane.find(".input_calib_weight:first").val(input_calib_weight[ctab][i]);
        plane.find(".input_calib_angle:first").val(calib_weight_angle[ctab][i]);
        plane.find(".input_OC_length:first").val(OC_length[ctab][i]);
        plane.find(".input_OC_angle:first").val(OC_angle[ctab][i]);
        plane.find(".output_C_length:first").val(C_length[ctab][i]);
        plane.find(".output_C_angle:first").val(C_angle[ctab][i]);
        plane.find(".output_cw_magnitude:first").val(cw_magnitude[ctab][i]);
        plane.find(".output_cw_angle:first").val(cw_angle[ctab][i]);
        plane.find(".output_H_length:first").val(H_length[ctab][i]);
        plane.find(".output_H_angle:first").val(H_angle[ctab][i]);
    }

    if(exporting_report != true)
    {
        ProcessDrawing(0);
        ProcessDrawing(1);
        DrawGraph();
        BuildTable();
    }
}

function CreateTabs(num)
{
    // Create tabs list
    $(".tab").remove();
    $(".nav_tabs").empty();
    var str = "";
    for(var i = 0; i < num; i ++)
    {
        str += '<div class="tab tab_' + i + '" style="display: none;">' + workspaces_names[i][0] + '</div>';
        str += '<script>$(".nav_tabs").on("click", ".tab_' + i + '", function() { SwitchTab(' + i + '); $(".input_inherit").val(' + i + '); });</script>';
    }
    $(".nav_tabs").append(str);

    $(".tab").css('color', current_color);
    $(".tab").css('border-color', current_color);

    $(".tab:first").ready(function (){
        $(".tab:first").trigger('click');
    });
    $(".tab").fadeIn(1500);

    // Create inherit list
    $(".input_inherit").empty();
    str = "";
    for(var i = 0; i < num; i ++)
    {
        str += '<option value="' + i + '">' + (i + 1);
    }
    $(".input_inherit").append(str);
    $(".input_inherit").val(0);

    used_tabs = num;
    CreateBearingCheckbox();
    DrawGraph();
    BuildTable();
}

$(".input_number_of_tabs").val(used_tabs);

function OnSelectNumberOfTabs(obj)
{
    CreateTabs(parseInt(obj.value));
}

$(document).ready(function() {
    OnSelectNumberOfTabs($(".input_number_of_tabs")[0]);
});

function OnInheritBearingData(obj)
{
    if (window.confirm("Are you sure you want to import data from bearing " + (parseInt(obj.value) + 1) + " to bearing " + (ctab+1) + "? All the changes you made to bearing " + (ctab+1) + " will be completely lost. Press OK to confirm. Press Cancel to discard this.") == false)
    {
        return 0;
    }

    var from_bearing = parseInt(obj.value);

    input_machine_type[ctab] = input_machine_type[from_bearing];
    input_runningmode[ctab] = input_runningmode[from_bearing];
    input_rotor_weight[ctab] = input_rotor_weight[from_bearing];
    input_bp_radius[ctab] = input_bp_radius[from_bearing];
    input_speed[ctab] = input_speed[from_bearing];
    input_measurement_type[ctab] = input_measurement_type[from_bearing];
    input_unit[ctab] = input_unit[from_bearing];
    input_scale[ctab] = input_scale[from_bearing];
    input_clockwise[ctab] = input_clockwise[from_bearing];
    clockwise[ctab] = (input_clockwise[ctab] == 0) ? false : true;
    input_balanceweight[ctab] = input_balanceweight[from_bearing];
    input_alarm[ctab] = input_alarm[from_bearing];
    input_danger[ctab] = input_danger[from_bearing];

    /*
    // Polar data
    for(var i = 0; i < 2; i ++)
    {
        sensor_angle_offset[ctab][i] = sensor_angle_offset[from_bearing][i];
        sensor_direction[ctab][i] = sensor_direction[from_bearing][i];
        O_length[ctab][i] = O_length[from_bearing][i];
        O_angle[ctab][i] = O_angle[from_bearing][i];
        input_calib_weight[ctab][i] = input_calib_weight[from_bearing][i];
        calib_weight_angle[ctab][i] = calib_weight_angle[from_bearing][i];
        OC_length[ctab][i] = OC_length[from_bearing][i];
        OC_angle[ctab][i] = OC_angle[from_bearing][i];
        C_length[ctab][i] = C_length[from_bearing][i];
        C_angle[ctab][i] = C_angle[from_bearing][i];
        cw_magnitude[ctab][i] = cw_magnitude[from_bearing][i];
        cw_angle[ctab][i] = cw_angle[from_bearing][i];
        H_length[ctab][i] = H_length[from_bearing][i];
        H_angle[ctab][i] = H_angle[from_bearing][i];
    }
    */

    SwitchTab(ctab);
    CalculateGraphStepSize();
    CalculateGraphMaxStep();

    ShowMessageBox(0, "Copied data successfuly from " + workspaces_names[from_bearing][0] + " to " + workspaces_names[ctab][0] + "");
    return 1;
}

var list_view = false;

function FixCanvasSize()
{
    var width, height;
    if(list_view)
    {
        width = $(".plane_single_axis:first").width() * 0.7;
        height = $(".plane_single_axis:first").height() * 0.6;
    }
    else
    {
        width = $(".plane_single_axis:first").width() * 0.95;
        height = width;
    }

    $(".draw_x").resizeCanvas(width, height);
    $(".draw_y").resizeCanvas(width, height);

    if(exporting_report != true)
	{
        ProcessDrawing(0);
        ProcessDrawing(1);
    }
}

$(window).resize(function(event) {
	FixCanvasSize();
});

$(document).ready(function() {
	FixCanvasSize();
});

$(".plane_grid_view").click(function(event) {
    if(list_view == true)
    {
        list_view = false;
        $(".plane_single_axis").velocity({width: '50%'}, {queue: false, duration:800, complete: function () {
            FixCanvasSize();
        }});
        ShowMessageBox(0, "Switched to grid view successfully");
    }
    else
    {
        ShowMessageBox(2, "Already using grid view style");
    }
});

$(".plane_list_view").click(function(event) {
    if(list_view == false)
    {
        list_view = true;
        $(".plane_single_axis").velocity({float: 'none', width: '100%'}, {queue: false, duration:800, complete: function () {
            FixCanvasSize();
        }});
        ShowMessageBox(0, "Switched to list view successfully");
    }
    else
    {
        ShowMessageBox(2, "Already using list view style");
    }
});

function ToggleCalibWeightFlashing(toggle)
{
    switch(toggle)
    {
        case true:
        {
            $(".advisable_calib_weight").css('display', 'inline-block');
            break;
        }
        case false:
        {
            $(".advisable_calib_weight").css('display', 'none');
            break;
        }
    }
}

$(".info_dialog").hide();

$(".info_dialog_close").click(function(event) {
    $(".info_dialog").fadeOut(500);
});

function ShowInfoDialog()
{
    $(".info_dialog").fadeIn(500);
}

/*function LeavingConfirmMessage()
{
     return "Changes you made will be lost. Is that okay?";
}

// Prevent accidental navigation away
$(document).ready(function() {
    $("input, select").bind("change", function() {
        window.onbeforeunload = LeavingConfirmMessage;
    });
});*/

var total_changes_made = 0;
var CheckChanges = function() {
    total_changes_made ++;
    if(total_changes_made == 15)
    {
        ShowMessageBox(0, "Never forget to save your work. Use \"Save Project\" button to save your work.");
    }
    else if(total_changes_made == 50)
    {
        ShowMessageBox(0, "You made a lot of changes. You might want to save your work. Use \"Save Project\" button to save your work.");
        $("input, select").unbind("change", CheckChanges);
    }
};

$(document).ready(function() {
    $("input, select").bind("change", CheckChanges);
});
