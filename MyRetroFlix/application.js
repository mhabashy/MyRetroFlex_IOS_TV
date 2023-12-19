//# sourceURL=application.js

//
//  application.js
//  MyRetroFlix
//
//  Created by Michael Habashy on 6/28/18.
//  Copyright © 2018 Michael Habashy. All rights reserved.
//

/*
 * This file provides an example skeletal stub for the server-side implementation 
 * of a TVML application.
 *
 * A javascript file such as this should be provided at the tvBootURL that is 
 * configured in the AppDelegate of the TVML application. Note that  the various 
 * javascript functions here are referenced by name in the AppDelegate. This skeletal 
 * implementation shows the basic entry points that you will want to handle 
 * application lifecycle events.
 */

/**
 * @description The onLaunch callback is invoked after the application JavaScript 
 * has been parsed into a JavaScript context. The handler is passed an object 
 * that contains options passed in for launch. These options are defined in the
 * swift or objective-c client code. Options can be used to communicate to
 * your JavaScript code that data and as well as state information, like if the 
 * the app is being launched in the background.
 *
 * The location attribute is automatically added to the object and represents 
 * the URL that was used to retrieve the application JavaScript.
 */

let movies = {};
let category = {};
let API = "http://167.99.4.68";
let searchMovies = [];


App.onLaunch = function(options) {
//    baseURL
    this.baseURL = options.BASEURL;
    
    var alert = createActivityIndicator("My Retro Flix Loading");
    navigationDocument.pushDocument(alert);
    loadData(`${API}/api/json/`, parseJSON);

}


App.onWillResignActive = function() {

}

App.onDidEnterBackground = function() {

}

App.onWillEnterForeground = function() {
    
}

App.onDidBecomeActive = function() {
    
}

App.onWillTerminate = function() {
    
}


/**
 * This convenience funnction returns an alert template, which can be used to present errors to the user.
 */
var createAlert = function(title, description) {

    var alertString = `<?xml version="1.0" encoding="UTF-8" ?>
        <document>
          <alertTemplate>
            <title>${title}</title>
            <description>${description}</description>
          </alertTemplate>
        </document>`

    var parser = new DOMParser();

    var alertDoc = parser.parseFromString(alertString, "application/xml");

    return alertDoc
}


function createActivityIndicator(title) {
    const markup = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
    <loadingTemplate>
    <activityIndicator>
    <text>${title}</text>
    </activityIndicator>
    </loadingTemplate>
    </document>`;
    
    return new DOMParser().parseFromString(markup, "application/xml")
}



function loadData(url, callback) {
    const request = new XMLHttpRequest();
    request.addEventListener("load", function() { callback(request.response); });
    request.open("GET", url, true);
    request.withCredentials = true;
    request.setRequestHeader("Authorization", 'Basic ' + btoa('flix:apininja'));;
    request.send();
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function parseJSON(text) {
    const json = JSON.parse(text);
    
    for(v of shuffle(json)) {
        
        var movie = {};
        movie.title = v['title'];
        movie.summary = v['description'];
        movie.director = v['directedBy'];
        movie.releaseDate = v['pubDate'];
        movie.duration = v['duration'];
        movie.coverURL = `${API}/static/covers/` + v['thumbnail'];
        movie.link = v['html5'];
        movie.writenBy = v['writtenBy'];
        movie.id = v['id'];
        movie.genre = "";

        for(c of v.category) {
            movie.genre += c + " ";
        }
        
        movie.genre = (movie.genre).slice(0, -2);
        
        for(c of v.category) {
            if(typeof category[c] === 'undefined' || category[c] === null) {
                category[c] = [];
                category[c].push(movie);
            } else {
                category[c].push(movie);
            }
        }
    }
    
    const shelfTitles = Object.keys(category).sort();
    const stack = createStackTemplate(shelfTitles);
    navigationDocument.replaceDocument(stack, navigationDocument.documents[0]);

    stack.addEventListener("play", handleMainEvent);
    stack.addEventListener("select", handleMainEvent);
}


function handleMainEvent(event) {
    
    const target = event.target;
    
    if (target.tagName === "buttonLockup") {
        SearchPage();
    } else if (target.tagName === "lockup" && typeof target.getAttribute("movieID") !== 'undefined') {
        const movieURL = target.getAttribute("movieURL");
        const movieID = target.getAttribute("movieID");
        zoomMovie(movieURL, movieID);
    } else {
        const movieURL = target.getAttribute("movieURL");
        playMovie(movieURL);
    }
}

function SearchPage() {
    const document = searchTemplate();
    var searchField = document.getElementById("SearchField"); //I added an id to the searchField to make it easy to access.
    var keyboard = searchField.getFeature("Keyboard");
    var results = [];
    keyboard.onTextChange = function () {
        runSearch(keyboard.text, function(myjson) {
                            results = myjson;
                  if (keyboard.text.length !== 0) {
                    document.getElementById("searchTitle").innerHTML = `Results (${results.length})`;
                    var tempTemplate = "";
                      for (v of results) {
                  
                          var movie = {};
                          movie.title = v['title'];
                          movie.summary = v['description'];
                          movie.director = v['directedBy'];
                          movie.releaseDate = v['pubDate'];
                          movie.duration = v['duration'];
                          movie.coverURL = `${API}/static/covers/` + v['thumbnail'];
                          movie.link = v['html5'];
                          movie.writenBy = v['writtenBy'];
                          movie.id = v['id'];
                          movie.genre = "";
                  
                          for(c of v['category']) {
                            movie.genre += c + " ";
                          }
                  
                          movie.genre = (movie.genre).slice(0, -2);
                          tempTemplate += createLockupElement(movie, movie.genre);
                      }
                    document.getElementById("searchResults").innerHTML = tempTemplate;
                  } else {
                    results = [];
                  }
                    console.log(results);
                 });
    };
    document.addEventListener("select", handleProductEvent);
    document.addEventListener("play", handleProductEvent);
//    document.addEventListener("select", runSearch);
    navigationDocument.pushDocument(document);
}

function runSearch(event, callback) {
    console.log(event);
    const request = new XMLHttpRequest();
    request.addEventListener("load", function() {
                              callback(JSON.parse(request.response));
                             });
    request.open("GET", `${API}/api/json/search/?q=${event}`, true);
    request.withCredentials = true;
    request.setRequestHeader("Authorization", 'Basic ' + btoa('flix:apininja'));;
    request.send();
}



function createLockupElement(movie, category) {
//<img width="250" height="370" src="${movie.coverURL}" />
    return `<lockup movieURL="${movie.link}" movieID="${movie.id}" genre="${category}">
    <img width="200" height="270" src="${movie.coverURL}" />
    <title>${movie.title}</title>
    </lockup>`;
}

function createStackTemplate(shelfTitles) {
    let markup = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
    <stackTemplate>
        <banner>
            <background>
                <img src="resource://banner" width="1920" height="500" />
            </background>
        </banner>
    
    <row>
        <buttonLockup>
        <badge src="resource://search" width="48" height="48" />
        <title>SEARCH</title>
        </buttonLockup>
    </row>
    <collectionList>`;
    
    for (g of shelfTitles) {
        markup += createShelfElement(g);
    }
    
    markup += `
    </collectionList>
    </stackTemplate>
    </document>`;
    
    return new DOMParser().parseFromString(markup, "application/xml")
}

function createShelfElement(genre) {
    let myreturn =  `<shelf>
    <header>
    <title>${genre}</title>
    </header>
    <section>`;
    for (v of category[genre]) {
        myreturn += createLockupElement(v, genre);
    }
    myreturn += `</section>
    </shelf>`;
    return myreturn;
}


function playSelectedMovie(event) {
    
    const selectedMovie = event.target;
    const movieURL = selectedMovie.getAttribute("movieURL");
    playMovie(movieURL);
}

function zoomSelectedMovie(event) {
    const selectedMovie = event.target;
    const movieURL = selectedMovie.getAttribute("movieURL");
    const movieID = selectedMovie.getAttribute("movieID");
    zoomMovie(movieURL, movieID);
}

function playMovie(url) {
    
    const mediaItem = new MediaItem("video", url);
    
    mediaItem.title = "TEST";
    const playlist = new Playlist();
    playlist.push(mediaItem);
    const player = new Player();
    player.playlist = playlist;
    player.play();
}

function zoomMovie(movieURL, movieID) {
    try {
        loadData(`${API}/api/json/${movieID}/`, openMovieTemplate);
    } catch (e) {
        console.log(e);
        return null;
    }
    
}


function createAlternativeMovie(movie) {
    return `<lockup movieURL="${movie.link}" movieID="${movie.id}">
    <img width="200" height="270" src="${movie.coverURL}" />
    <title>${movie.title}</title>
    </lockup>`;
}

function openMovieTemplate(text) {
    const json = JSON.parse(text);
    
    var movie = json;
    
    loadData(App.baseURL + "/product.xml", function (template) {
             var genre = '';
//             for (int i = 0; i < movie['category'].length(); i++) {
//                genre = movie['category'][i] + ", ";
//             }
             for (c of movie['category']) {
                genre += c + ", ";
             }
             if (genre != '') {
                genre = genre.slice(0, -2);
             }
             template = template.replace(/\[GENRE\]/g, genre);
             template = template.replace("[TITLE]", movie.title);
             template = template.replace("[SUMMARY]", movie.description);
             template = template.replace("[COVERURL]",  `${API}/static/covers/` + movie.thumbnail);
             template = template.replace("[DIRECTOR]", movie.directedBy);
             template = template.replace("[RELEASEDATE]", movie.pubDate);
             template = template.replace("[HTML5]",movie.html5);
             template = template.replace("[ID]",movie.id);
             if (movie.category.length > 0) {
                 let otherMovies = [];
             
                 for (om of category[movie.category[0]]) {
                     if (movie.id !== om.id) {
                        otherMovies.push(om);
                     }
                 }
                 const alternatives = otherMovies.map(createAlternativeMovie).join("");
                 template = template.replace("[ALTERNATIVES]", alternatives);
             }
             
             let document = new DOMParser().parseFromString(template,"application/xml")
             
             document.addEventListener("select", handleProductEvent);
             document.addEventListener("play", handleProductEvent);
             
             navigationDocument.pushDocument(document);
             });
}

function handleProductEvent(event) {
    
    const target = event.target;
    
    if (target.tagName === "description") {
        const body = target.textContent;
        const alertDocument = createAlert('', body);
        navigationDocument.presentModal(alertDocument);
    } else if (target.tagName === "lockup") {
        const movieURL = target.getAttribute("movieURL");
        const movieID = target.getAttribute("movieID");
        zoomMovie(movieURL, movieID);
    } else {
        const movieURL = target.getAttribute("movieURL");
        playMovie(movieURL);
    }
}

function searchTemplate() {
    let templet = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
    <searchTemplate>
    <searchField id="SearchField" />
    <shelf>
    <header>
    <title id="searchTitle"></title>
    </header>
    <section id="searchResults">
    </section>
    </shelf>
    </searchTemplate>
    </document>`;
    return new DOMParser().parseFromString(templet, "application/xml");
}

