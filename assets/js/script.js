var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
    // create elements that make up a task item
    var taskLi = $("<li>").addClass("list-group-item");
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(taskDate);
    var taskP = $("<p>")
        .addClass("m-1")
        .text(taskText);

    // append span and p element to parent li
    taskLi.append(taskSpan, taskP);

    // check due date
    auditTask(taskLi);

    // append to ul list on the page
    $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
    tasks = JSON.parse(localStorage.getItem("tasks"));

    // if nothing in localStorage, create a new object to track all task status arrays
    if (!tasks) {
        tasks = {
            toDo: [],
            inProgress: [],
            inReview: [],
            done: []
        };
    }

    // loop over object properties
    $.each(tasks, function (list, arr) {
        // then loop over sub-array
        arr.forEach(function (task) {
            createTask(task.text, task.date, list);
        });
    });
};

var saveTasks = function () {
    localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
    // gets the text value of the span
    var date = $(taskEl).find("span").text().trim();

    // gets the moment.js time variable from the text and sets it to 5pm
    var time = moment(date, "L").set("hour", 17);
    
    // removes any current color classes from the element
    $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

    // checks to see what color to assign based on due date
    if (moment().isAfter(time)) {

        // red for in the past
        $(taskEl).addClass("list-group-item-danger");
    } else if (Math.abs(moment().diff(time, "days")) <= 2) {

        // yellow for within 2 days
        $(taskEl).addClass("list-group-item-warning");
    }
};

// converts <p> element of description to text input so user can edit a task.
$(".list-group").on("click", "p", function () {

    // get the current text value
    var text = $(this).text().trim();

    // creates the input element and replaces it
    var textInput = $("<textarea>").addClass("form-control").val(text);
    $(this).replaceWith(textInput);

    // focuses the input so we can type immidiately 
    textInput.trigger("focus");
});

// listens for the user to click away and saves the input
$(".list-group").on("blur", "textarea", function () {

    // get the text within the box
    var text = $(this).val().trim();

    // gets the list that the input belongs to
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");

    // gets the ordinal number of the list element
    var index = $(this)
        .closest(".list-group-item")
        .index();

    // updates the task in the task object
    tasks[status][index].text = text;
    saveTasks();

    // technically reloading would do the same thing that the final lines do.
    // location.reload();

    // create and replace the text box
    var taskP = $("<p>").addClass("m-1").text(text);
    $(this).replaceWith(taskP);
});

// handles clicking on the date of a created task
$(".list-group").on("click", "span", function () {

    // get the current date set
    var date = $(this).text().trim();

    // creates the input
    var dateInput = $("<input>")
        .attr("type", "text")
        .addClass("form-control")
        .val(date);

    // replaces the text box with the input field
    $(this).replaceWith(dateInput);

    // creates the date picker popup
    dateInput.datepicker({
        minDate: 1,
        // set the action of clicking off the picker to be considered a change event
        // this is important to prevent errors on attempting to convert it back to a <span>
        onClose: function() {
            $(this).trigger("change");
        }
    });

    // set the input to focus so we can type in it immidiately
    dateInput.trigger("focus");
});

// listens for the date picker to change or the user to click off after typing
$(".list-group").on("change", "input[type='text']", function() {

    // get the final value of the input
    var date = $(this).val().trim();

    // get the list it belongs to
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");

    // get the element's position in the list
    var index = $(this)
        .closest(".list-group-item")
        .index();

    // set the tasks object to reflect the change adn save it to local storage
    tasks[status][index].date = date;
    saveTasks();

    // This


    // creates and replaces the input with the <span>
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(date);

    $(this).replaceWith(taskSpan);

    // colors the element based on the new date
    auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
    // clear values
    $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
    // highlight textarea
    $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function () {
    // get form values
    var taskText = $("#modalTaskDescription").val();
    var taskDate = $("#modalDueDate").val();

    if (taskText && taskDate) {
        createTask(taskText, taskDate, "toDo");

        // close modal
        $("#task-form-modal").modal("hide");

        // save in tasks array
        tasks.toDo.push({
            text: taskText,
            date: taskDate
        });

        saveTasks();
    }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
    for (var key in tasks) {
        tasks[key].length = 0;
        $("#list-" + key).empty();
    }
    saveTasks();
});

// adds the date picker to the modal
$("#modalDueDate").datepicker({
    minDate: 1
});

// load tasks for the first time
loadTasks();

// creates the drag and drop list functionality
$(".card .list-group").sortable({
    connectWith: $(".card .list-group"),
    scroll: false,
    tolerance: "pointer",
    helper: "clone",
    activate: function(event) {
        $(this).addClass("dropover");
        $(".bottom-trash").addClass("bottom-trash-drag");
    },
    deactivate: function(event) {
        $(this).removeClass("dropover dropover-active");
        $(".bottom-trash").removeClass("bottom-trash-drag");
    },
    over: function(event) {
        $(this).addClass("dropover-active");
    },
    out: function(event) {
        $(this).removeClass("dropover-active");
    },

    // listens for <li> to update position
    update: function(event) {
        // array to store new <ul> info
        var tempArr = [];
        
        // runs through each of the children of the updated list
        $(this).children().each(function() {
            var text = $(this)
                .find("p")
                .text()
                .trim();

            var date = $(this)
                .find("span")
                .text()
                .trim();

            tempArr.push({
                text: text,
                date: date
            });
        });

        // gets the correct list name
        var arrName = $(this)
            .attr("id")
            .replace("list-", "")

        // updates tasks and save it locally
        tasks[arrName] = tempArr;
        saveTasks();
    }
});

// makes the trash div at bottom a droppable location that will delete an element
$("#trash").droppable({
    accept: ".card .list-group-item",
    tolerance: "touch",
    drop: function(event, ui) {
        ui.draggable.remove();
        $(this).removeClass("bottom-trash-active");
    },
    over: function(event, ui) {
        $(this).addClass("bottom-trash-active");
    },
    out: function(event, ui) {
        $(this).removeClass("bottom-trash-active");
    }
})

setInterval(function() {
    $(".card .list-group-item").each(function(index, el) {
        auditTask(el);
    });
}, 1800000);