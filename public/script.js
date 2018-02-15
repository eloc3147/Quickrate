var menu_div, viewer_div, password_field, img_frame, album_id, password, photo_list, thumb;
var preload_cache = [], preload_q = [], preload_workers = {};

var FORWARD = true;
var BACKWARD = false;

var index = -1;

var CONCURRENT_LOADS = 6;

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

// Return the callback for list items being clicked
function makeLink(name) {
    return function(event) {
        event.preventDefault();
        loadAlbum(name);
    }
}

function cleanup(parent) {
    return function() {
        preload_cache.push(parent.img);
        delete preload_workers[parent.id];
        preloadTick();
    }
}

function PreloadWorker(id, src) {
    this.id = id;
    this.src = src;
    this.img = new Image();
    this.img.onload = cleanup(this);
    this.img.src = this.src;
}

function preloadTick() {
    if((Object.keys(preload_workers).length < CONCURRENT_LOADS) && (preload_q.length > 0)) {
        var id = uuidv4();
        preload_workers[id] = new PreloadWorker(id, preload_q.shift().src);
        preloadTick();
    }
}

function changeImage(direction) {
    if(direction == FORWARD) {
        index++;
    } else {
        index--;
    }
    if(index >= photo_list.length) {
        index = 0;
    } else if (index < 0) {
        index = photo_list.length - 1;
    }
    img_frame.attr("src", photo_list[index].src);
    updateThumb();
}

function updateThumb() {
    if(photo_list[index]["rating"] === true) {
        thumb.show();
    } else {
        thumb.hide();
    }
}

function toggleRating() {
    if(photo_list[index]["rating"] === true) {
        photo_list[index]["rating"] = false;        
    } else {
        photo_list[index]["rating"] = true;
    }
    $.post( "api/rate", {
        index: index,
        album_id: album_id,
        photo_id: photo_list[index]["id"],
        password: password,
        like: photo_list[index]["rating"]? 1 : 0
    });
    updateThumb();
}

// Switch from menu view to viewer view
function loadAlbum(name) {
    menu_div.hide();
    viewer_div.show();
    $.post( "api/album", {name: name}).done(function( data ) {
        if(data["error"] && data["error"] == "Album not found") {
            menu_div.show();
            viewer_div.hide();
            password_field.get(0).setCustomValidity('This album does not seem to exist');
            password_field.get(0).reportValidity();
            return;
        }
        [album_id, password] = name.split("#");
        for(i=0;i<data.length;i++) {
            data[i].src = ["api/photo", album_id, data[i]["id"], password, i].join("/");
        }
        photo_list = data;
        
        changeImage(FORWARD);
        preload_q = photo_list.slice();
        preloadTick();

        $(document).keydown(function(e) {
            switch(e.which) {
                // Right arrow
                case 39:
                    e.preventDefault();
                    changeImage(FORWARD);
                    break;
                case 37:
                    e.preventDefault();
                    changeImage(BACKWARD);
                    break;
                case 38:
                    e.preventDefault();
                    toggleRating();
                    break;
            }
          });
    });
}

// Generate and show the list of saved albums on the page
function genList(container) {
    var list = Cookies.getJSON('saved_albums') || [];

    for(var id in list) {
        $("<h5><a href>" + list[id] + "</a></h5>").click(makeLink(id)).appendTo(container);
    }
}

// Add a new album to the list of saved albums in the cookie
function addAlbum(id, nickname) {
    var list = Cookies.getJSON('saved_albums') || {};
    if (!(id in list)) {
        list[id] = nickname;
        Cookies.set("saved_albums", list);
    }
}

// Do DOM stuff on page load
$(document).ready(function(){
    var list_div = $("#known-list");
    var submit_button = $("#submit-password");
    password_field = $("#password");
    menu_div = $("#menu");
    viewer_div = $("#viewer");
    img_frame = $("#picture");
    thumb = $("#like");

    submit_button.click(function(event){
        event.preventDefault();
        password_field.get(0).reportValidity();
        var nick_list = [password_field.val()];
        
        $.post( "api/nicks", {data: nick_list}).done(function( data ) {
            var nickname = data[password_field.val()];
            if(typeof nickname !== 'undefined') {
                addAlbum(password_field.val(), nickname);
                loadAlbum(password_field.val());
            } else {
                password_field.get(0).setCustomValidity('This album does not seem to exist');
                password_field.get(0).reportValidity();
            }
        });
        
    });

    genList(list_div);
});
