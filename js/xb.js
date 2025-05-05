function showSeries(seriesId) {
    var i, tabcontent, tabbuttons;
    
    // xx
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }
    
    // xx
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    }
    
    // xx
    document.getElementById(seriesId).style.display = "block";
    document.getElementById(seriesId).classList.add("active");
    event.currentTarget.className += " active";
}
