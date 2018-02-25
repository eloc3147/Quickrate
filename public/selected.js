// Do DOM stuff on page load
$(document).ready(function(){
    let listContainer = $('#list');
    let password_field = $("#password");
    var submit_button = $("#submit-password");
    submit_button.click(function(event){
        event.preventDefault();
        password_field.get(0).reportValidity();
        $.post( 'api/selected', {
            password_string: password_field.val()
        }).done(function( data ) {
            if('error' in data) {
                if(data['error'] == 'Album not found') {
                    password_field.get(0).setCustomValidity('This album does not seem to exist');
                    password_field.get(0).reportValidity();
                } else if(data['error'] == 'Incorrect password') {
                    password_field.get(0).setCustomValidity('This password is incorrect');
                    password_field.get(0).reportValidity();
                }
            } else {
                for(i=0;i<data['photos'].length;i++) {
                    $('<span class="line-item ' + (data['photos'][i]['like']? 'like': 'dislike') + '">' + data['photos'][i]['filename'] + '</span>').appendTo(listContainer);
                }
            }
        });
    });
});
